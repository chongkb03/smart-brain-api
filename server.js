const express = require('express');

const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');


const Clarifai = require('clarifai');

const db = knex({
  client: 'pg',
  connection: {
    connectionString : process.env.DATABASE_URL,
    ssl: true
  }
});





const app = express();

app.use(bodyParser.json());
app.use(cors());

const cApp = new Clarifai.App({
apiKey: 'ebcde1ec1ef8436aba3ad24110debac6'

});


const database = {

	users: [
    {	
    id: '123',
	name: 'John',
    email: 'john@gmail.com',
    password: '123',
    entries:20,
    joined: new Date()
     },
   {	
    id: '124',
	name: 'Sally',
    email: 'sally@gmail.com',
     password: '123',
    entries:0,
    joined: new Date()
     }


	],

	login: [
	{
     id: '123',
     hash: '',
     email: 'john@gmail.com'

	}

	]

}


app.get('/',(req, res) => {

	console.log('inside get');

	db('users')
   .select('*').from('users')
   .then(data => res.json(data))
   .catch(e => console.log('Error getting recs from users table'+ e))
 }


app.post('/signin', (req,res)=> {

	console.log (req.body.email + ' : ' + req.body.password);
   
   db('users')
   .select('email','hash').from('login')
   .where('email','=',req.body.email)
   .then(data => {
         
         
         if (data.length) {
            const isValid = bcrypt.compareSync(req.body.password,data[0].hash);
            if (isValid)
               {
               return db.select('*').from('users')
               .where ('email','=',req.body.email)
               .then(d => {
                     res.json(d[0]);
                     }) 
               .catch(e=> {
                console.log('Cannot get users');
                       res.status(400).json('Cannot get users');
                       })

                }
            else
               {
                console.log('password not valid');
               res.status(400).json('Password not valid');

               } 

            }
         else
         {
          console.log('Cannot get Login');
           res.status(400).json('Email not valid');

         }

        })
   .catch(e =>{
    console.log(e);
res.status(400).json(e);

   } )


})

app.post('/register',(req,res)=> {
	
	const {name, email, password } = req.body;
	let genHash ='aaa';

	console.log('register : '+email);

	const hash = bcrypt.hashSync(password);
  db.transaction(trx => {
     trx.insert({
               hash: hash,
               email: email
               })
     .into('login')
     .returning('email')
     .then(loginEmail => {
          return trx('users')
          .returning('*')
          .insert({
                 name: name,
                 email: loginEmail[0],
                 joined: new Date()
                 })
          .then(r => {         
               res.json(r[0]);
               })
          })
    .then(trx.commit)
    .then(trx.rollback)
     })
    
    .catch(e => {
      console.log(e);
      res.status(400).json(e);
    })

    
})


app.get('/profile/:id',(req, res) => {
 
   const {id} = req.params;
   

   db('users')
   .select('*').from('users').where({id})
   .then(u => {
         console.log(u[0]);
         if (u.length) {
           res.json(u[0]);
         }
         else
         {
           res.status(400).json('Record Not Found!');

         }

   })
   .catch(e => res.status(400).json(e));


})





app.put('/image', (req,res)=> {
	 const {id} = req.body;
   db('users')
   .where('id', id)
   .increment('entries',1)
   .returning('entries')
   .then(entry => {
    console.log(entry[0]);
    res.json(entry[0]);
   })
   .catch(err => res.status(400).json(e));
   	
    
})





app.post('/imageURL', (req,res)=> {
   const {input} = req.body;
   
   cApp.models.predict(Clarifai.FACE_DETECT_MODEL, input)
   .then (r => {
    console.log(r);
    res.json(r);
   })
   .catch (e => {
      res.status(400).json(e);
   })
    
})


PORT = process.env.PORT || 4000

app.listen(PORT, ()=> {

	console.log('app is running at '+PORT);
});