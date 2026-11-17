// Run with: npm run seed
// Creates an admin account and a few sample internships.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Internship = require('./models/Internship');
const AptitudeTest = require('./models/AptitudeTest');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let admin = await User.findOne({ email: 'admin@example.com' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('Admin created -> admin@example.com / admin123');
  } else {
    console.log('Admin already exists');
  }

  // Demo company account (so the company side can be shown)
  let company = await User.findOne({ email: 'company@example.com' });
  if (!company) {
    company = await User.create({
      name: 'HR Manager',
      email: 'company@example.com',
      password: 'company123',
      role: 'company',
      companyName: 'TechNova Solutions',
      industry: 'Software',
      location: 'Bengaluru',
      website: 'https://technova.example.com',
      about: 'Product company building web and mobile apps.',
    });
    console.log('Company created -> company@example.com / company123');
  }

  if ((await Internship.countDocuments()) === 0) {
    const inDays = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
    await Internship.insertMany([
      {
        title: 'Full Stack Developer Intern',
        company: 'TechNova Solutions',
        description: 'Build features across the MERN stack alongside our product team.',
        location: 'Bengaluru',
        mode: 'Hybrid',
        stipend: 10000,
        durationMonths: 3,
        skillsRequired: ['React', 'Node.js', 'MongoDB'],
        openings: 3,
        deadline: inDays(30),
        createdBy: admin._id,
      },
      {
        title: 'UI/UX Design Intern',
        company: 'PixelCraft Studio',
        description: 'Design wireframes and prototypes for web and mobile products.',
        location: 'Remote',
        mode: 'Remote',
        stipend: 8000,
        durationMonths: 2,
        skillsRequired: ['Figma', 'User Research'],
        openings: 2,
        deadline: inDays(20),
        createdBy: admin._id,
      },
      {
        title: 'Data Analyst Intern',
        company: 'InsightWorks',
        description: 'Clean datasets, build dashboards and present insights to stakeholders.',
        location: 'Hubballi',
        mode: 'Onsite',
        stipend: 6000,
        durationMonths: 6,
        skillsRequired: ['Python', 'SQL', 'Excel'],
        openings: 1,
        deadline: inDays(45),
        createdBy: admin._id,
      },
    ]);
    console.log('Sample internships created');
  }

  // TechNova's internships belong to the demo company account
  await Internship.updateMany({ company: 'TechNova Solutions' }, { createdBy: company._id });

  // At least one free (no stipend) internship so the Free filter has data
  if (!(await Internship.findOne({ stipend: 0 }))) {
    await Internship.create({
      title: 'Campus Ambassador Intern (Free)',
      company: 'GreenLeaf Foundation',
      description: 'Volunteer-style internship: promote our programs on campus and run events.',
      location: 'Remote',
      mode: 'Remote',
      stipend: 0,
      durationMonths: 2,
      skillsRequired: ['Communication', 'Social Media'],
      openings: 5,
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
    });
    console.log('Free sample internship created');
  }

  // Sample aptitude test for the Full Stack internship (so the test flow can be shown)
  const fullStack = await Internship.findOne({ title: 'Full Stack Developer Intern' });
  if (fullStack && !(await AptitudeTest.exists({ internship: fullStack._id }))) {
    await AptitudeTest.create({
      internship: fullStack._id,
      createdBy: fullStack.createdBy,
      title: 'Full Stack Aptitude Test',
      durationMinutes: 10,
      passPercent: 60,
      questions: [
        { question: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Mark Language'], correctIndex: 0 },
        { question: 'Which database is used in the MERN stack?', options: ['MySQL', 'MongoDB', 'Oracle', 'SQLite'], correctIndex: 1 },
        { question: 'If a train travels 60 km in 1.5 hours, what is its speed?', options: ['30 km/h', '35 km/h', '40 km/h', '45 km/h'], correctIndex: 2 },
        { question: 'What comes next: 2, 4, 8, 16, ?', options: ['24', '30', '32', '64'], correctIndex: 2 },
        { question: 'Which hook is used for state in React?', options: ['useEffect', 'useState', 'useRef', 'useMemo'], correctIndex: 1 },
      ],
    });
    console.log('Sample aptitude test created');
  }

  await mongoose.disconnect();
  console.log('Seeding done');
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
