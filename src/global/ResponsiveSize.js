const { HEIGHT, WIDTH } = require("./Layout")
const hp = (pixel) => { return HEIGHT * (pixel / 375) }
const wp = (pixel) => { return WIDTH * (pixel / 375) }
export { hp, wp }