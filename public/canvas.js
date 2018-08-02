var can = document.getElementById("canv");
var ctx = document.getElementById("canv").getContext("2d");
var canvas = $("#canv");
var hidden = $('input[name="signature"]');

ctx.strokeStyle = "black";
ctx.lineWidth = 5;

(function exCan() {
    var draw;
    var x, y;
    canvas.on("mousedown", function(e) {
        x = e.offsetX;
        y = e.offsetY;
        draw = true;
    });
    canvas.on("mousemove", function(e) {
        if (draw) {
            ctx.moveTo(x, y);
            ctx.lineTo(e.offsetX, e.offsetY);
            x = e.offsetX;
            y = e.offsetY;
            ctx.stroke();
        }
    });
    $(document).on("mouseup", function(e) {
        draw = false;
    });
})();
console.log("something");
var submit = $("button");
submit.on("click", function(e) {
    var secret = can.toDataURL();
    hidden.val(secret);
});
