const { Perspective, UserPerspective, sequelize } = require('../../models');
const axios = require('axios');

async function getStateFromZip(zip) {
  try {
    const response = await axios.get(`https://api.zippopotam.us/us/${zip}`);
    return response.data.places[0]['state abbreviation'];
  } catch (error) {
    console.error('Error getting state from zip:', error);
    return 'Unknown';
  }
}

async function createIdmePerspectives(userId, idmeProfile) {
  try {
    const [result] = await sequelize.query(
      'SELECT MAX("perspectiveId") + 1 as next_id FROM "Perspectives"'
    );
    let nextId = result[0].next_id || 1;

    const perspectives = [];

    // Create student perspective
    if (idmeProfile.status.find(s => s.group === 'student' && s.verified)) {
      const studentPerspective = await Perspective.create({
        perspectiveId: nextId++,
        perspectiveName: 'Student',
        categoryType: 'sociographic',
        verificationMethod: 'education',
        verificationDate: new Date(),
        activityScore: 0,
        options: ['{student}'],
        type: 'student'
      });
      perspectives.push(studentPerspective);
    }

    // Create zip code perspective
    const zip = idmeProfile.attributes.find(a => a.handle === 'zip').value;
    const zipPerspective = await Perspective.create({
      perspectiveId: nextId++,
      perspectiveName: `Lives in ${zip}`,
      categoryType: 'LOCATION',
      userId,
      verificationMethod: 'IDME',
      verificationStatus: 'VERIFIED',
      verificationDate: new Date(),
      organization: 'Location',
      activityScore: 0,
      metadata: {
        zipCode: zip
      }
    });
    perspectives.push(zipPerspective);

    // Get state from zip code and create state perspective
    const state = await getStateFromZip(zip);
    const statePerspective = await Perspective.create({
      perspectiveId: nextId++,
      perspectiveName: `Lives in ${state}`,
      categoryType: 'LOCATION',
      userId,
      verificationMethod: 'IDME',
      verificationStatus: 'VERIFIED',
      verificationDate: new Date(),
      organization: 'Location',
      activityScore: 0,
      metadata: {
        state: state
      }
    });
    perspectives.push(statePerspective);

    // Create UserPerspective entries
    await Promise.all(perspectives.map(perspective => 
      UserPerspective.create({
        userId,
        perspectiveId: perspective.perspectiveId
      })
    ));

    return perspectives;
  } catch (error) {
    console.error('Error creating ID.me perspectives:', error);
    throw error;
  }
}

module.exports = { createIdmePerspectives }; 