//consts
const FPS = 30;
const SHIP_SIZE = 30;
const TURN_SPEED = 360; //degree per second
const SHIP_THRUST = 5; //acceleration in pixel
const FRICTION = 0.7; //friction coeff
const ASTEROID_NUM = 3; //initial number of asteroids
const ASTEROID_SPEED = 70; //max speed of the asteroid pixel/second
const ASTEROID_SIZE = 100; //size of the asteroid in pixels
const ASTEROID_JAGGEDNESS = 0.4; // jaggedness of asteroid 0-1
const MAX_ASTEROID_VERTICES = 15;
const SHOW_BOUNDING = false;
const SHOW_CENTRE_DOT = false;
const SHIP_EXPLODE_DURATION = 0.3; //duration of the ship explosion
const SHIP_INVINCIBILITY_DUR = 3; //invincibility duration in seconds
const SHIP_BLINK_DUR = 0.1;//ship blinking duratioin during invincibility in seconds
const LASER_MAX = 10; //maximum laseres on the screen
const LASER_SPEED = 500; //speed of laser pixel/second
const LASER_MAX_DISTANCE = 0.6; //maximum distance a laser can travel as a fraction of the screen width
const LASER_EXPLODE_DURATION = 0.3; //duration of the laser explosion
const canvas = document.querySelector("#game-canvas");

//globals
let c = canvas.getContext("2d");
function rand_int(min, max) {
    return Math.floor(Math.random() * (max - min - 1) + min);
}
function distance_between_points(x1, y1, x2, y2) {
    return Math.sqrt(
        (x2 - x1) ** 2 + (y2 - y1) ** 2
    );
}

//game objects
class Laser {
    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.distance_traveled = 0;
        this.explode_time = 0;
        this.exploding = false;
    }
    manage_explosion_state() {
        if (this.explode_time > 0) {
            this.exploding = true;
        }
        else {
            this.explode_time = 0;
            this.exploding = false;
        }
    }
    draw() {
        //normal laser when not exploding
        if (!this.exploding) {
            c.fillStyle = "#e5ff00";
            c.beginPath();
            c.arc(this.x, this.y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
            c.fill();
        }
        else {
            c.fillStyle = "orange";
            c.beginPath();
            c.arc(this.x, this.y, (SHIP_SIZE / 2) * 0.75, 0, Math.PI * 2, false);
            c.fill();

            c.fillStyle = "salmon";
            c.beginPath();
            c.arc(this.x, this.y, (SHIP_SIZE / 2) * 0.5, 0, Math.PI * 2, false);
            c.fill();

            c.fillStyle = "#pink";
            c.beginPath();
            c.arc(this.x, this.y, (SHIP_SIZE / 2) * 0.25, 0, Math.PI * 2, false);
            c.fill();
        }
    }
    handle_screen_edge() {
        if (this.x < 0) {
            this.x = canvas.width;
        }
        else if (this.x > canvas.width) {
            this.x = 0;
        }
        if (this.y < 0) {
            this.y = canvas.height;
        }
        else if (this.y > canvas.height) {
            this.y = 0;
        }
    }
    update() {
        if (!this.exploding) {
            this.x += this.dx;
            this.y -= this.dy;
            //calculate distance covered
            this.distance_traveled += Math.sqrt(this.dx ** 2 + this.dy ** 2);
        }


        this.handle_screen_edge();
        this.manage_explosion_state();
        this.draw();
    }
    static explode(laser) {
        laser.explode_time = Math.ceil(LASER_EXPLODE_DURATION * FPS);
    }
}
class Ship {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.r = SHIP_SIZE / 2;
        this.a = (90 / 180) * Math.PI;//current angle
        this.rot = 0;//current rotation speed with direction represented with sign
        this.thrusting = false;
        this.thrust_mag = {
            x: 0,
            y: 0
        };//velocity in pixel per second
        this.explode_time = 0;
        this.exploding = false;
        this.blink_time = Math.ceil(SHIP_BLINK_DUR * FPS);
        this.blink_num = Math.ceil(SHIP_INVINCIBILITY_DUR / SHIP_BLINK_DUR);
        this.invincible = true;
        this.can_shoot = true;
        this.lasers = [];
    }
    manage_explosion_state() {
        if (this.explode_time > 0) {
            this.exploding = true;
        }
        else {
            this.explode_time = 0;
            this.exploding = false;
        }
    }
    handle_blinking() {
        if (this.blink_num > 0) {
            this.blink_time--;
            if (this.blink_time == 0) {
                this.blink_time = Math.ceil(SHIP_BLINK_DUR * FPS);
                this.blink_num--;
            }
        }
    }
    set_invincibility_state() {
        if (this.blink_num > 0) {
            this.invincible = true;
        }
        else {
            this.invincible = false;
        }
    }
    handle_screen_edge() {
        if (this.x < 0 - this.r) {
            this.x = canvas.width + this.r;
        }
        else if (this.x > canvas.width + this.r) {
            this.x = 0 - this.r;
        }
        if (this.y < 0 - this.r) {
            this.y = canvas.height + this.r;
        }
        else if (this.y > canvas.height + this.r) {
            this.y = 0 - this.r;
        }
    }
    shoot_laser() {
        if (this.can_shoot && this.lasers.length < LASER_MAX) {
            this.lasers.push(new Laser(
                this.x + (4 / 3) * this.r * Math.cos(ship.a),
                this.y - (4 / 3) * this.r * Math.sin(ship.a),
                LASER_SPEED * Math.cos(ship.a) / FPS,
                LASER_SPEED * Math.sin(ship.a) / FPS
            ));
        }
        this.canShoot = false;
    }
    draw() {
        //not drawing the ship and thruster while the ship is under explosion
        if (!this.exploding) {//drawing thruster
            if (this.blink_num % 2 == 0) {
                if (this.thrusting) {//draw thruster
                    c.strokeStyle = "red";
                    c.fillStyle = "yellow";
                    c.lineWidth = SHIP_SIZE / 20;
                    c.beginPath();

                    c.moveTo(//rear left
                        this.x - this.r * ((2 / 3) * Math.cos(this.a) + 0.5 * Math.sin(this.a)),
                        this.y + this.r * ((2 / 3) * Math.sin(this.a) - 0.5 * Math.cos(this.a))
                    );

                    c.lineTo(//center behind the ship
                        this.x - (6 / 3) * this.r * Math.cos(ship.a),
                        this.y + (6 / 3) * this.r * Math.sin(ship.a)
                    );
                    c.lineTo(//rear right
                        this.x - this.r * ((2 / 3) * Math.cos(this.a) - 0.5 * Math.sin(this.a)),
                        this.y + this.r * ((2 / 3) * Math.sin(this.a) + 0.5 * Math.cos(this.a))
                    );
                    c.fill();
                    c.closePath();
                    c.stroke();
                }

                //drawing ship
                c.strokeStyle = "white";
                c.lineWidth = SHIP_SIZE / 20;
                c.beginPath();

                c.moveTo(//nose
                    this.x + (4 / 3) * this.r * Math.cos(ship.a),
                    this.y - (4 / 3) * this.r * Math.sin(ship.a)
                );

                c.lineTo(//rear left
                    this.x - this.r * ((2 / 3) * Math.cos(this.a) + Math.sin(this.a)),
                    this.y + this.r * ((2 / 3) * Math.sin(this.a) - Math.cos(this.a))
                );

                c.lineTo(//rear right
                    this.x - this.r * ((2 / 3) * Math.cos(this.a) - Math.sin(this.a)),
                    this.y + this.r * ((2 / 3) * Math.sin(this.a) + Math.cos(this.a))
                );
                c.closePath();
                c.stroke();
            }
        }
        else {
            //draw the explosion
            c.fillStyle = "darkred";
            c.beginPath();
            c.arc(this.x, this.y, this.r * 1.7, 0, Math.PI * 2, false);
            c.fill();

            c.fillStyle = "red";
            c.beginPath();
            c.arc(this.x, this.y, this.r * 1.5, 0, Math.PI * 2, false);
            c.fill();

            c.fillStyle = "orange";
            c.beginPath();
            c.arc(this.x, this.y, this.r * 1.2, 0, Math.PI * 2, false);
            c.fill();

            c.fillStyle = "yellow";
            c.beginPath();
            c.arc(this.x, this.y, this.r * 0.9, 0, Math.PI * 2, false);
            c.fill();

            c.fillStyle = "white";
            c.beginPath();
            c.arc(this.x, this.y, this.r * 0.6, 0, Math.PI * 2, false);
            c.fill();
        }

        //center dot
        if (SHOW_CENTRE_DOT) {
            c.fillStyle = "red";
            c.fillRect(this.x - 1, this.y - 1, 2, 2);
        }

        //bounding circle
        if (SHOW_BOUNDING) {
            c.strokeStyle = "lime";
            c.beginPath();
            c.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
            c.stroke();
        }
    }

    update() {
        //only move the ship if it is not exploding
        if (!this.exploding) {
            //thrust
            if (ship.thrusting) {
                this.thrust_mag.x += SHIP_THRUST * Math.cos(this.a) / FPS;
                this.thrust_mag.y -= SHIP_THRUST * Math.sin(this.a) / FPS;
            } else {
                this.thrust_mag.x -= this.thrust_mag.x * FRICTION / FPS;
                this.thrust_mag.y -= this.thrust_mag.y * FRICTION / FPS;
            }
            //rotate
            this.a += this.rot;

            //move the ship
            ship.x += ship.thrust_mag.x;
            ship.y += ship.thrust_mag.y;
        }

        this.handle_screen_edge();
        this.manage_explosion_state();
        this.handle_blinking();
        this.set_invincibility_state();
        this.draw();
    }
    static explode(ship) {
        ship.explode_time = Math.ceil(SHIP_EXPLODE_DURATION * FPS);
    }
}

class Asteroid {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.dx = Math.random() * ASTEROID_SPEED / FPS * (Math.random() < 0.5 ? -1 : 1);
        this.dy = Math.random() * ASTEROID_SPEED / FPS * (Math.random() < 0.5 ? -1 : 1);
        this.r = r;
        this.a = Math.random() * Math.PI * 2;
        this.color = "#adadad";
        this.vertices = rand_int(5, MAX_ASTEROID_VERTICES);
        this.vertices_offset = [];
        for (let i = 0; i < this.vertices; i++) {
            this.vertices_offset.push(Math.random() * ASTEROID_JAGGEDNESS * 2 + 1 - ASTEROID_JAGGEDNESS);
        }
    }
    draw() {
        c.strokeStyle = this.color;
        c.lineWidth = SHIP_SIZE / 20;
        let offsets = this.vertices_offset;
        //draw path
        c.beginPath();
        c.moveTo(
            this.x + this.r * Math.cos(this.a) * offsets[0],
            this.y + this.r * Math.sin(this.a) * offsets[0]
        );
        //draw the polygon
        for (let i = 0; i < this.vertices; i++) {
            c.lineTo(
                this.x + this.r * Math.cos(this.a + i * Math.PI * 2 / this.vertices) * offsets[i + 1],
                this.y + this.r * Math.sin(this.a + i * Math.PI * 2 / this.vertices) * offsets[i + 1],
            );
        }
        c.closePath();
        c.stroke();

        //bounding circle
        if (SHOW_BOUNDING) {
            c.strokeStyle = "red";
            c.beginPath();
            c.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
            c.stroke();
        }
    }

    handle_screen_edge() {
        if (this.x < -this.r) {
            this.x = canvas.width + this.r;
        }
        else if (this.x > canvas.width + this.r) {
            this.x = -this.r;
        }
        if (this.y < -this.r) {
            this.y = canvas.height + this.r;
        }
        else if (this.y > canvas.height + this.r) {
            this.y = -this.r;
        }
    }

    update() {
        //movement
        this.x += this.dx;
        this.y += this.dy;

        this.handle_screen_edge();
        this.draw();
    }
    static destroy(asteroid_arr, idx) {
        let [x, y, r] = [asteroid_arr[idx].x, asteroid_arr[idx].y, asteroid_arr[idx].r];
        //split int two new asteroids if required
        if (r == Math.ceil(ASTEROID_SIZE / 2)) {
            asteroid_arr.push(new Asteroid(x, y, Math.ceil(ASTEROID_SIZE / 4)));
            asteroid_arr.push(new Asteroid(x, y, Math.ceil(ASTEROID_SIZE / 4)));
        }
        else if (r == Math.ceil(ASTEROID_SIZE / 4)) {
            asteroid_arr.push(new Asteroid(x, y, Math.ceil(ASTEROID_SIZE / 8)));
            asteroid_arr.push(new Asteroid(x, y, Math.ceil(ASTEROID_SIZE / 8)));
        }
        //remove parent asteroid from asteroid_arr
        asteroid_arr.splice(idx, 1);
    }
}

//game logic
let ship = new Ship();
let asteroid_arr = [];

function create_asteroids() {
    asteroid_arr = [];
    let x, y;
    for (let i = 0; i < ASTEROID_NUM; i++) {
        do {
            x = rand_int(0, canvas.width);
            y = rand_int(0, canvas.height);
        } while (
            distance_between_points(
                ship.x,
                ship.y,
                x,
                y
            ) < ASTEROID_SIZE * 2 + ship.r
        );

        asteroid_arr.push(new Asteroid(x, y, Math.ceil(ASTEROID_SIZE / 2)));
    }
}


function update() {
    //space
    c.fillStyle = "black";
    c.fillRect(0, 0, canvas.width, canvas.height);
    ship.update();
    for (let i of asteroid_arr) {
        i.update();
    }
    for (let i of ship.lasers) {
        i.update();
    }
    //delete the lasers if they have traveled more distance than const LASER_MAX_DISTANCE * canvas width
    for (let i = ship.lasers.length - 1; i >= 0; i--) {
        if (ship.lasers[i].distance_traveled > LASER_MAX_DISTANCE * canvas.width) {
            ship.lasers.splice(i, 1);
        }
    }
    //collision check if the ship is not invincible
    if (!ship.exploding && !ship.invincible) {
        for (let i = asteroid_arr.length - 1; i >= 0; i--) {
            if (distance_between_points(ship.x, ship.y, asteroid_arr[i].x, asteroid_arr[i].y) < ship.r + asteroid_arr[i].r) {
                Ship.explode(ship);
                Asteroid.destroy(asteroid_arr, i);
                break;
            }

        }
    }
    else {
        ship.explode_time--;
        if (ship.explode_time == 0) {
            ship = new Ship();
        }
    }
    //collision of laser with asteroids and remove asteroids and lasers that collide
    for (let i = asteroid_arr.length - 1; i >= 0; i--) {
        let [ax, ay, ar] = [asteroid_arr[i].x, asteroid_arr[i].y, asteroid_arr[i].r];
        for (let j = ship.lasers.length - 1; j >= 0; j--) {
            let [lx, ly] = [ship.lasers[j].x, ship.lasers[j].y];

            if (!ship.lasers[j].exploding && distance_between_points(ax, ay, lx, ly) < ar) {

                Asteroid.destroy(asteroid_arr, i);
                Laser.explode(ship.lasers[j]);
                break;
            }
            else{
                ship.lasers[j].explode_time--;
                if(ship.lasers[j].explode_time==0){
                    ship.lasers.splice(j,1);
                }
            }
        }
    }
    if(asteroid_arr.length == 0){
        for (let j = ship.lasers.length - 1; j >= 0; j--) {
            if (ship.lasers[j].exploding) {
                ship.lasers[j].explode_time--;
                if(ship.lasers[j].explode_time==0){
                    ship.lasers.splice(j,1);
                }
            }
        }
    }
}

//event listeners
document.addEventListener("keyup", (e) => {
    switch (e.key) {
        case "ArrowLeft":
            ship.rot = 0;
            break;

        case "ArrowRight":
            ship.rot = -0;
            break;
        case "ArrowUp":
            ship.thrusting = false;
            break;
        case " ":
            ship.can_shoot = true;
            break;
    }
});
document.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowLeft":
            ship.rot = (TURN_SPEED / 180) * Math.PI / FPS;
            break;

        case "ArrowRight":
            ship.rot = -(TURN_SPEED / 180) * Math.PI / FPS;
            break;
        case "ArrowUp":
            ship.thrusting = true;
            break;
        case " ":
            ship.shoot_laser();
            break;
    }
});

//game loop
create_asteroids();
setInterval(update, 1000 / FPS);