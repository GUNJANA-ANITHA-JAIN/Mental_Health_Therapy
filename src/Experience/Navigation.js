import * as THREE from 'three';
import Experience from './Experience.js';
import normalizeWheel from 'normalize-wheel';

export default class Navigation {
    constructor() {
        this.experience = new Experience();
        this.targetElement = this.experience.targetElement;
        this.camera = this.experience.camera;
        this.config = this.experience.config;
        this.time = this.experience.time;

        this.setView();
    }

    setView() {
        this.view = {
            spherical: {
                value: new THREE.Spherical(30, Math.PI * 0.35, -Math.PI * 0.25),
                smoothed: new THREE.Spherical(30, Math.PI * 0.35, -Math.PI * 0.25),
                smoothing: 0.005,
                limits: {
                    radius: { min: 10, max: 50 },
                    phi: { min: 0.01, max: Math.PI * 0.5 },
                    theta: { min: -Math.PI * 0.5, max: 0 },
                },
            },
            target: {
                value: new THREE.Vector3(0, 2, 0),
                smoothed: new THREE.Vector3(0, 2, 0),
                smoothing: 0.005,
                limits: {
                    x: { min: -4, max: 4 },
                    y: { min: 1, max: 6 },
                    z: { min: -4, max: 4 },
                },
            },
            drag: {
                delta: { x: 0, y: 0 },
                previous: { x: 0, y: 0 },
                sensitivity: 1,
                alternative: false,
            },
            zoom: { sensitivity: 0.01, delta: 0 },
        };

        this.initEventHandlers();
    }

    initEventHandlers() {
        // Mouse events
        this.targetElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        window.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('touchstart', (e) => this.onTouchStart(e));
    }

    onMouseDown(event) {
        event.preventDefault();
        this.view.drag.previous.x = event.clientX;
        this.view.drag.previous.y = event.clientY;

        this.view.drag.alternative = event.button === 2 || event.ctrlKey || event.shiftKey;

        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    onMouseMove(event) {
        this.view.drag.delta.x += event.clientX - this.view.drag.previous.x;
        this.view.drag.delta.y += event.clientY - this.view.drag.previous.y;

        this.view.drag.previous.x = event.clientX;
        this.view.drag.previous.y = event.clientY;
    }

    onMouseUp() {
        window.removeEventListener('mousemove', this.onMouseMove.bind(this));
        window.removeEventListener('mouseup', this.onMouseUp.bind(this));
    }

    onWheel(event) {
        const normalized = normalizeWheel(event);
        this.view.zoom.delta += normalized.pixelY;
    }

    onTouchStart(event) {
        if (event.touches.length > 1) this.view.drag.alternative = true;
        this.view.drag.previous.x = event.touches[0].clientX;
        this.view.drag.previous.y = event.touches[0].clientY;

        window.addEventListener('touchmove', (e) => this.onTouchMove(e));
        window.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }

    onTouchMove(event) {
        this.view.drag.delta.x += event.touches[0].clientX - this.view.drag.previous.x;
        this.view.drag.delta.y += event.touches[0].clientY - this.view.drag.previous.y;

        this.view.drag.previous.x = event.touches[0].clientX;
        this.view.drag.previous.y = event.touches[0].clientY;
    }

    onTouchEnd() {
        window.removeEventListener('touchmove', this.onTouchMove.bind(this));
        window.removeEventListener('touchend', this.onTouchEnd.bind(this));
    }

    update() {
        const { spherical, target, zoom, drag } = this.view;

        // Zoom
        spherical.value.radius += zoom.delta * zoom.sensitivity;
        spherical.value.radius = Math.max(
            spherical.limits.radius.min,
            Math.min(spherical.value.radius, spherical.limits.radius.max)
        );

        if (drag.alternative) {
            const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.modes.default.instance.quaternion);
            const right = new THREE.Vector3(-1, 0, 0).applyQuaternion(this.camera.modes.default.instance.quaternion);

            up.multiplyScalar(drag.delta.y * 0.01);
            right.multiplyScalar(drag.delta.x * 0.01);

            target.value.add(up).add(right);
        } else {
            spherical.value.theta -= drag.delta.x * drag.sensitivity / this.config.smallestSide;
            spherical.value.phi -= drag.delta.y * drag.sensitivity / this.config.smallestSide;

            spherical.value.theta = Math.max(
                spherical.limits.theta.min,
                Math.min(spherical.value.theta, spherical.limits.theta.max)
            );
            spherical.value.phi = Math.max(
                spherical.limits.phi.min,
                Math.min(spherical.value.phi, spherical.limits.phi.max)
            );
        }

        // Reset deltas
        drag.delta.x = drag.delta.y = zoom.delta = 0;

        // Smooth
        ['radius', 'phi', 'theta'].forEach((key) => {
            spherical.smoothed[key] +=
                (spherical.value[key] - spherical.smoothed[key]) * spherical.smoothing * this.time.delta;
        });

        ['x', 'y', 'z'].forEach((axis) => {
            target.smoothed[axis] +=
                (target.value[axis] - target.smoothed[axis]) * target.smoothing * this.time.delta;
        });

        const viewPosition = new THREE.Vector3().setFromSpherical(spherical.smoothed).add(target.smoothed);

        this.camera.modes.default.instance.position.copy(viewPosition);
        this.camera.modes.default.instance.lookAt(target.smoothed);
    }
}
