var express = require("express");
var bodyparser = require("body-parser");
var tp = require("tedious-promises");
var sesion = require("express-session");
var TYPES = require("tedious").TYPES;
var middleware = require("./middleware/sessionM");

var app = express();

app.use(bodyparser.json());

app.use(bodyparser.urlencoded({extended:true}));

app.use(sesion({
    secret: '12345',
    resave: false,
    saveUninitialized: false
}));

app.set("view engine", "jade");

var config = {
  userName: "user",
  password: "pass",
  server: "127.0.0.1",
  options: {
    database: "personal",
    encrypt: true,
    port: 1433
  }
};

tp.setConnectionConfig(config);

app.use("/app", middleware.estaLogueado);

app.route("/")
.get(function(req, res){
    if(req.session && req.session.email && req.session.password){
        res.redirect("/app");
    }
    res.render("index");
})
.post(function(req, res){
    var email = req.body.email;
    var password = req.body.password;
    
    tp.sql("select count(*) as count from persona where email=@email and password=@password")
    .parameter('email', TYPES.NChar, email)
    .parameter('password', TYPES.NChar, password)
    .execute()
    .then(function(result){
        if(result[0].count == 1){
            req.session.email=email;
            req.session.password=password;
            res.redirect("/app");
        }
        res.render("index", {mensaje: "El usuario o contraseña no coinciden"});
    })
    .fail(function(err){
        response = err;
        res.render("index", {mensaje: response});
    });
});

app.get("/app", function(req, res){
    tp.sql("select * from persona")
    .execute()
    .then(function(result){
        if(result.length > 0){
            res.render("crud", {personas:result});
        }
    })
    .fail(function(err){
        res.render("crud", {mensaje:err});
    });
});

app.route("/app/new")
.get(function(req, res){
    res.render("new");
})
.post(function(req,res){
    tp.sql("insert into persona(Nombre, Apellidos, email, password) values (@nombre, @apellidos, @email, @password)")
    .parameter('nombre', TYPES.NChar, req.body.nombre)
    .parameter('apellidos', TYPES.NChar, req.body.apellidos)
    .parameter('email', TYPES.NChar, req.body.email)
    .parameter('password', TYPES.NChar, req.body.password)
    .execute()
    .then(function(result){
        if(result){
            res.redirect("/app");
        }
    })
    .fail(function(err){
        res.render("new", {mensaje: "Error al insertar, a continuación se presenta el error: " + err})
    });
});

app.route("/app/edit/:id")
.get(function(req, res){
    tp.sql("select * from persona where IDPersona=@id")
    .parameter('id',TYPES.Int, req.params.id)
    .execute()
    .then(function(result){
        res.render("edit", {persona: result[0]})
    })
    .fail(function(err){
        res.render("edit", {mensaje:"Error al realizar la edicion, a continuación se presenta el error: " + err})
    });
})
.post(function(req, res){

    tp.sql("update persona set Nombre=@nombre, Apellidos=@apellidos, email=@email, password=@password where IDPersona=@id")
    .parameter('id',TYPES.Int, req.params.id)
    .parameter('nombre', TYPES.NChar, req.body.nombre)
    .parameter('apellidos', TYPES.NChar, req.body.apellidos)
    .parameter('email', TYPES.NChar, req.body.email)
    .parameter('password', TYPES.NChar, req.body.password)
    .execute()
    .then(function(result){
        res.redirect("/app/edit/" + req.params.id);
    })
    .fail(function(err){
        res.render("edit", {mensaje:"Error al realizar la edicion, a continuación se presenta el error: " + err})
    });
});

app.route("/app/delete/:id")
.get(function(req, res){
    tp.sql("select * from persona where IDPersona=@id")
    .parameter('id',TYPES.Int, req.params.id)
    .execute()
    .then(function(result){
        res.render("delete", {persona: result[0]})
    })
    .fail(function(err){
        res.render("delete", {mensaje:"Error al realizar la edicion, a continuación se presenta el error: " + err})
    });
})
.post(function(req, res){

    tp.sql("delete from persona where IDPersona=@id")
    .parameter('id',TYPES.Int, req.params.id)
    .execute()
    .then(function(result){
        res.redirect("/app")
    })
    .fail(function(err){
        res.render("delete", {mensaje:"Error al realizar la eliminación, a continuación se presenta el error: " + err})
    });
});

app.route("/app/view/:id")
.get(function(req, res){
    tp.sql("select * from persona where IDPersona=@id")
    .parameter('id',TYPES.Int, req.params.id)
    .execute()
    .then(function(result){
        res.render("view", {persona: result[0]})
    })
    .fail(function(err){
        res.render("view", {mensaje:"Error al realizar la edicion, a continuación se presenta el error: " + err})
    });
})

app.listen(3030);