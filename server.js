const express = require("express");
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const bodyParser = require("body-parser");
const server = express();
const sqlite3 = require("sqlite3");
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const db = new sqlite3.Database("./db/fashion.db");
const { body, validationResult } = require('express-validator');


server.use(bodyParser.urlencoded({ extended: true }));
//server.use(express.json());
server.use(express.static(__dirname + '/public'));
server.set('view engine', 'ejs');
server.use(cookieParser());
const port = 3108;
const timeExp = 1000 * 60 * 60;


server.use(sessions({
    secret: "rfghf66a76ythggi87au7td",
    saveUninitialized: true,
    cookie: { maxAge: timeExp },
    resave: false
}));


server.get('/logi', (req, res) => {
    res.render('login')
});


server.get('/', (req, res) => {
    res.render('index')
});
server.post('/login', (req, res) => {
    let name_user = req.body.name_user;
    let contraseña = req.body.contraseña;
    db.get("SELECT contraseña, nombres FROM registro WHERE name_user=$name_user", {
        $name_user: name_user
    }, (error, rows) => {
        if (rows) {
            if (bcrypt.compareSync(contraseña, rows.contraseña)) {
                session = req.session;
                session.userNam = name_user;
                let name=rows.nombres
                return res.render('logOn', { name: name });
            } return res.send("El usuario o la contraseña han sido incorrectos por favor coorrobore e intentelo de nuevo")
        } return res.send("El usuario o la contraseña han sido incorrectos por favor verifique su informacion e intentelo de nuevo")
    })
})



server.get('/registro', (req, res) => {
    res.render('registre')
});
server.post("/registre", [
    body('contraseña').isLength({ min: 8 }),
    body('email').isEmail(),
    body('telefono').isNumeric()
],
    (req, res) => {
        const errors = validationResult(req, res)
        if (!errors.isEmpty()) {
            return res.send('Los datos ingresados no son validos, revise por favor')
        }

        let nombres = req.body.nombres;
        let apellidos = req.body.apellidos;
        let telefono = req.body.telefono;
        let email = req.body.email;
        let fecha_nacimiento = req.body.fecha_nacimiento;
        let name_user = req.body.name_user;
        let contraseña = req.body.contraseña;
        let confi_contraseña = req.body.retificar_contraseña;


        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(contraseña, salt);
        const hashC = bcrypt.hashSync(confi_contraseña, salt)

        db.run(`INSERT INTO registro(nombres, apellidos, telefono, email, fecha_nacimiento, name_user, contraseña, confi_contraseña) VALUES(?,?,?,?,?,?,?,?)`,
            [nombres, apellidos, telefono, email, fecha_nacimiento, name_user, hash, hashC],
            function (error) {
                if (!error) {
                    console.log("insert ok")

                } else {
                    console.log("inset error", error);
                }
            }
        );

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
                user: 'fashionfriendly11@gmail.com',
                pass: 'ovqqzgmartdgmouq'
            }
        });
        transporter.sendMail({
            from: 'fshnfriendly@gmail.com',
            to: email,
            subject: 'Registro exitoso',
            html: '<h1>SU REGISTRO FUE EXITOSO</h1><img src="https://res.cloudinary.com/fashion-friendly/image/upload/v1654705518/logo/1_fwuaqt.png"><p>Apreciado Usuario(a), el presente correo es para informar que ha sido registrado(a) correctamente en nuestro aplicativo web <b>Fashion Friendly</b> Esperamos que nuestra aplicación sea de su agrado y disfrute de todas las herramientas brindadas en esta web</p>',
        }).then((res) => { console.log(res); }).catch((err) => { console.log(err); })

        res.render('index')
    });



server.get('/logOut', (req, res) => {
    session = req.session;
    if (session.userNam) {
        req.session.destroy();
        return res.redirect('/');
    }
    return res.send('No tiene sesion para cerrar')
})






server.get('/recuperar', (req, res) => {
    res.render('recuperar')
})



server.get('/nosotros', (req, res) => {
    res.render('sobre_nosotros')
})




server.get('/sessionIn', (req, res) => {
    res.render('logOn')
})



server.get('/crear', (req, res) => {
    res.render('crear')
})



server.get('/crearHom', (req, res) => {
    db.all('SELECT * FROM camisasHom ', (error, rows) => {
        let linkCami = rows
        db.all('SELECT * FROM pantalonHom', (error, rows) => {
            let linkPan = rows
            res.render('crearHom', { linkCami: linkCami, linkPan: linkPan });
        })
    })
})

server.get('/crearMu', (req, res) => {
    db.all('SELECT * FROM camisasMu ', (error, rows) => {
        let linkCami = rows
        db.all('SELECT * FROM pantalonMu', (error, rows) => {
            let linkPan = rows
            res.render('crearMu', { linkCami: linkCami, linkPan: linkPan });
        })
    })
})



server.get('/guardarcombinacion', (req, res) => {
    session = req.session;
    let pantalonUrl = req.query.pantalon
    let camisaUrl = req.query.camisa

    db.all(`INSERT INTO combinacionesDeRopaHom(name_user,combinacionPan, cambinacionCam) VALUES (?, ?, ?)`,
        [session.userNam, pantalonUrl, camisaUrl],
        function (error) {
            if (!error) {
                console.log("insert ok")

            } else {
                console.log("inset error", error);
            }
        }
    )
})


server.listen(port, () => {
    console.log(`Su puerto es  ${port}`);
});

