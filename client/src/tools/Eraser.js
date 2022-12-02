import Brush from './Brush';

export default class Eraser extends Brush {
    constructor(canvas, socket, id, isEraser) {
        super(canvas, socket, id, isEraser);
    };

    static draw(ctx, x, y, lineWidth) {
        this.ctx.strokeStyle = 'white';
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.lineWidth = lineWidth;
    };
};
