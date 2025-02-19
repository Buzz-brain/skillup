const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Connect to MongoDB
mongoose.connect('mongodb+srv://chinomsochristian03:ahYZxLh5loYrfgss@cluster0.dmkcl.mongodb.net/skillup?retryWrites=true&w=majority');


app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.render('index');
  });
app.get('/client-login', (req, res) => {
    res.render('loginClient');
  });
app.get('/worker-login', (req, res) => {
    res.render('loginWorker');
  });
app.get('/worker-register', (req, res) => {
    res.render('registerWorker');
  });
app.get('/client-register', (req, res) => {
    res.render('registerClient');
  });
app.get('/post', (req, res) => {
    res.render('postJob');
  });
app.get('/dashboard', (req, res) => {
    res.render('dashboard');
  });

// Define schemas for skilled workers and clients
const skilledWorkerSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    phoneNumber: String,
    password: String,
    role: { type: String, default: 'skilledWorker' }
  });
  

const clientSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    phoneNumber: String,
    password: String,
    role: { type: String, default: 'client' }
  });
  

const jobSchema = new mongoose.Schema({
    artisan: String,
    natureOfService: String,
    jobDescription: String,
    serviceAddress: String,
    timeline: String,
    duration: String,
    budget: String,
    fullName: String,
    phoneNumber: String,
    imageUrl: String
});


// Create models for skilled workers and clients
const SkilledWorker = mongoose.model('SkilledWorker', skilledWorkerSchema);
const Client = mongoose.model('Client', clientSchema);
const Job = mongoose.model('Job', jobSchema);

const verifyToken = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'Access denied. No token provided.' });
  
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
  
    try {
      const decoded = jwt.verify(token, 'secretkey');
      req.user = decoded;
      console.log(req.user)
      next();
    } catch (error) {
      res.status(400).json({ message: 'Invalid token.' });
    }
  };
  

  const authorizeClient = async (req, res, next) => {
    if (req.user.id && req.user.role === 'client') {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden. Only clients can access this resource.' });
    }
  };
  

// API endpoints

// Register skilled worker
app.post('/register-skilled-worker', async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, password } = req.body;
        console.log(req.body)
        const hashedPassword = await bcrypt.hash(password, 10);
        const skilledWorker = new SkilledWorker({ firstName, lastName, email, phoneNumber, password: hashedPassword });
        await skilledWorker.save();
        res.json({ message: 'Skilled worker registered successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Error registering skilled worker' });
    }
});

// Register client
app.post('/register-client', async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const client = new Client({ firstName, lastName, email, phoneNumber, password: hashedPassword });
        await client.save();
        res.json({ message: 'Client registered successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Error registering client' });
    }
});

// Login skilled worker
app.post('/login-skilled-worker', async (req, res) => {
    try {
        const { email, password } = req.body;
        const skilledWorker = await SkilledWorker.findOne({ email });
        if (!skilledWorker) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const isValidPassword = await bcrypt.compare(password, skilledWorker.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: skilledWorker._id, role: skilledWorker.role }, 'secretkey', { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(400).json({ message: 'Error logging in skilled worker' });
    }
});

// Login client
app.post('/login-client', async (req, res) => {
    try {
        const { email, password } = req.body;
        const client = await Client.findOne({ email });
        if (!client) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const isValidPassword = await bcrypt.compare(password, client.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: client._id, role: client.role }, 'secretkey', { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(400).json({ message: 'Error logging in client' });
    }
});




// Post job
app.post('/post-job', verifyToken, authorizeClient, async (req, res) => {
    try {
      const { artisan, natureOfService, jobDescription, serviceAddress, timeline, duration, budget, fullName, phoneNumber, imageUrl  } = req.body;
      if(!artisan || !natureOfService || !jobDescription || !serviceAddress || !timeline || !duration || !budget || !fullName || !phoneNumber || !imageUrl) {
        res.status(400).json({ message: 'All Fields are required' });
      }
      const job = new Job({ artisan, natureOfService, jobDescription, serviceAddress, timeline, duration, budget, fullName, phoneNumber, imageUrl });
      await job.save();
      res.json({ message: 'Job posted successfully' });
    } catch (error) {
      res.status(400).json({ message: 'Error posting job' });
    }
  });
  

  // View all jobs
app.get('/view-jobs', async (req, res) => {
    try {
      const jobs = await Job.find().sort({ createdAt: -1 });
      res.json(jobs);
    } catch (error) {
      res.status(400).json({ message: 'Error fetching jobs' });
    }
  });

app.listen(3000, () => {
    console.log('Server listening on port 3000');
  });