import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef, useState } from 'react';
import canvasState from '../store/canvasState';
import toolState from '../store/toolState';
import '../styles/canvas.scss';
import Brush from '../tools/Brush';
import { Modal, Button } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import Rect from '../tools/Rect';
import axios from "axios";
import Circle from '../tools/Circle';
import Eraser from '../tools/Eraser';
import Line from '../tools/Line';

export const Canvas = observer( () => {
    const canvasRef = useRef();
    const usernameRef = useRef();
    const [modal, setModal] = useState(true);
    const params = useParams();

    useEffect(() => {
        canvasState.setCanvas(canvasRef.current);
        let ctx = canvasRef.current.getContext('2d')
        axios.get(`http://localhost:5000/image?id=${params.id}`)
            .then((res) => {
                const img = new Image();
                img.src = res.data;
                img.onload = () => {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    ctx.drawImage(img, 0 , 0, canvasRef.current.width, canvasRef.current.height);
                };
            })
    }, [])

    useEffect(() => {
        if (canvasState.username) {
            const socket = new WebSocket('ws://localhost:5000/');
            canvasState.setSocket(socket);
            canvasState.setSessionId(params.id);
            toolState.setTool(new Brush(canvasRef.current, socket, params.id));


            socket.onopen = () => {
                socket.send(JSON.stringify({
                    id: params.id,
                    username: canvasState.username,
                    method: 'connection',
                }))
            };
            socket.onmessage = (event) => {
                let msg = JSON.parse(event.data);
                switch (msg.method) {
                    case 'connection':
                        console.log(`Пользователь ${msg.username} присоединился`);
                        break;
                    case 'draw':
                        drawHandler(msg);
                        break;
                };
            };
        };
    }, [canvasState.username])

    const drawHandler = (msg) => {
        const { type, x, y, r, currentX, currentY, width, height, color, strokeColor, lineWidth } = msg.figure;
        const ctx = canvasRef.current.getContext('2d');
        switch (type) {
            case 'brush':
                Brush.draw(ctx, x, y, strokeColor, lineWidth);
                break;
            case 'rect':
                Rect.staticDraw(ctx, x, y, width, height, color, strokeColor, lineWidth);
                break;
            case 'circle':
                Circle.staticDraw(ctx, x, y, r,  color,  strokeColor,  lineWidth);
                break;
            case 'eraser':
                Eraser.staticDraw(ctx, x, y, lineWidth);
                break;
            case 'line':
                Line.staticDraw(ctx, x, y, currentX,  currentY,  strokeColor, lineWidth);
                break;
            case 'finish':
                ctx.beginPath();
                break;
        }
    };
    const mouseDownHandler = () => {
        canvasState.pushToUndo(canvasRef.current.toDataURL());
        axios.post(`http://localhost:5000/image?id=${params.id}`, {img: canvasRef.current.toDataURL()})
    };

    const connectHandler = () => {
        canvasState.setUsername(usernameRef.current.value);
        setModal(false);
    };

    return (
        <div className='canvas'>
            <Modal show={modal} onHide={() => {}}>
                <Modal.Header closeButton>
                    <Modal.Title>Введите ваше имя</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <input type="text" ref={usernameRef} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => connectHandler()}>
                        Войти
                    </Button>
                </Modal.Footer>
            </Modal>
            <canvas 
                onMouseDown={() => mouseDownHandler()}
                ref={canvasRef} 
                width={600} 
                height={400} 
            />
        </div>
    );
});
