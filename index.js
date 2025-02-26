const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Connect to MongoDB
// mongoose.connect('mongodb+srv://chinomsochristian03:ahYZxLh5loYrfgss@cluster0.dmkcl.mongodb.net/skillup?retryWrites=true&w=majority');

// Set up MongoDB connection
async function connectToMongoDB() {
  try {
    await mongoose.connect('mongodb+srv://chinomsochristian03:ahYZxLh5loYrfgss@cluster0.dmkcl.mongodb.net/skillup?retryWrites=true&w=majority');
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection error:', err);
  }
}
connectToMongoDB();

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
  res.render('postjob');
});
app.get('/postskill', (req, res) => {
  res.render('postskill');
});
app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});
app.get('/skillworkers', (req, res) => {
  res.render('skillworkers');
});

// Define schemas for skilled workers and clients
const skilledWorkerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phoneNumber: String,
  password: String,
  role: { type: String, default: 'skilledWorker' },
  skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
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
  duration: String,
  budget: String,
  fullName: String,
  phoneNumber: String,
  imageUrl: String
});

const skillSchema = new mongoose.Schema({
  profilepic: [{ type: String }],
  businessName: String,
  skillName: String,
  bio: String,
  location: String,
  certifications: [{ type: String }],
  experience: String,
  photos: [{ type: String }],
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SkilledWorker' }
});




// Create models for skilled workers and clients
const SkilledWorker = mongoose.model('SkilledWorker', skilledWorkerSchema);
const Client = mongoose.model('Client', clientSchema);
const Job = mongoose.model('Job', jobSchema);
const Skill = mongoose.model('Skill', skillSchema);

const verifyToken = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'Access denied. No token provided.' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, 'secretkey');
    req.user = decoded;
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
    console.log(error)
    res.status(400).json({ message: 'Error logging in client' });
  }
});




// Post job
app.post('/post-job', verifyToken, authorizeClient, async (req, res) => {
  try {
    const { artisan, natureOfService, jobDescription, serviceAddress, duration, budget, fullName, phoneNumber, imageUrl } = req.body;
    console.log(req.body)
    if (!artisan || !natureOfService || !jobDescription || !serviceAddress || !duration || !budget || !fullName || !phoneNumber || !imageUrl) {
      return res.status(400).json({ message: 'All Fields are required' });
    }
    const job = new Job({ artisan, natureOfService, jobDescription, serviceAddress, duration, budget, fullName, phoneNumber, imageUrl });
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

// Delete all jobs
app.delete('/delete-all-jobs', async (req, res) => {
  try {
    await Job.deleteMany();
    res.json({ message: 'All jobs deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting jobs' });
  }
});

// Get user details
app.get('/user-details', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let user;

    if (req.user.role === 'client') {
      user = await Client.findById(userId);
    } else if (req.user.role === 'skilledWorker') {
      user = await SkilledWorker.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching user details' });
  }
});


app.post('/create-skill-profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status({ message: "No User Found" })
    }
    const existingSkill = await Skill.findOne({ postedBy: userId });
    if (existingSkill) {
      return res.status(400).json({ message: 'You have already posted a skill. Please update your existing skill instead.' });
    }
    const { skillName, businessName, location, bio, photos, profilepic, certifications, experience } = req.body;
    // Create a new skill document
    const skill = new Skill({
      skillName,
      businessName,
      location,
      bio,
      photos,
      profilepic,
      certifications,
      experience,
      postedBy: userId
    });
    await skill.save();
    res.json({ message: 'Skill profile created successfully', skillId: skill._id });
  } catch (error) {
    res.status(400).json({ message: 'Error creating skill profile' });
  }
});


app.patch('/update-skill/:skillId', verifyToken, async (req, res) => {
  try {
    const skillId = req.params.skillId;
    const { skillName, businessName, location, bio, photos, profilepic, certifications, experience } = req.body;

    // Find the skill and check if it belongs to the current user
    const skill = await Skill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    if (skill.postedBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You can only update your own skills.' });
    }

    // Update the skill
    skill.skillName = skillName;
    skill.businessName = businessName;
    skill.location = location;
    skill.bio = bio;
    skill.photos = photos;
    skill.profilepic = profilepic;
    skill.certifications = certifications;
    skill.experience = experience;

    await skill.save();
    res.json({ message: 'Skill updated successfully' });
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: 'Error updating skill' });
  }
});



  app.get('/skills', async (req, res) => {
    try {
      const skills = await Skill.find();
      res.json(skills);
    } catch (error) {
      res.status(400).json({ message: 'Error fetching skills' });
    }
  });

app.delete('/delete-all-skills', async (req, res) => {
  try {
    await Skill.deleteMany();
    res.json({ message: 'All skills deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting skills' });
  }
});


app.listen(3000, () => {
  console.log('Server listening on port 3000');
});