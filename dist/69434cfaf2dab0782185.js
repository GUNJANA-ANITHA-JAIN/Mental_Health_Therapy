import"./style.css";import Experience from"./Experience/Experience.js";import{io}from"socket.io-client";const experienceElement=document.querySelector(".experience");experienceElement&&(window.experience=new Experience({targetElement:experienceElement}));const socket=io("http://localhost:3000");socket.on("connect",(()=>{console.log(`Connected as ${socket.id}`),socket.emit("newUser",{id:socket.id})})),socket.on("updateState",(e=>{console.log("State Update:",e),window.experience&&window.experience.updateOtherUsers(e)}));