const Internship = require('../models/Internship');

// Ids of the internships a company user has posted
module.exports = async (userId) =>
  (await Internship.find({ createdBy: userId }).select('_id')).map((i) => i._id);
