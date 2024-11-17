const { google } = require('googleapis');
const { Perspective, UserPerspective } = require('../../models');

async function generateGmailPerspectives(userId, accessToken) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Search for specific types of emails
    const subscriptionEmails = await searchEmails(gmail, 'subject:subscription OR subject:receipt');
    const eventEmails = await searchEmails(gmail, 'subject:ticket OR subject:confirmation');

    const perspectives = [];

    // Process subscription emails
    for (const email of subscriptionEmails) {
      const serviceName = extractServiceName(email);
      if (serviceName) {
        perspectives.push({
          perspectiveName: `${serviceName} Subscriber`,
          type: 'gmail',
          userId,
          options: {
            source: 'subscription_email',
            emailId: email.id
          }
        });
      }
    }

    // Process event emails
    for (const email of eventEmails) {
      const eventName = extractEventName(email);
      if (eventName) {
        perspectives.push({
          perspectiveName: `${eventName} Attendee`,
          type: 'gmail',
          userId,
          options: {
            source: 'event_email',
            emailId: email.id
          }
        });
      }
    }

    // Save perspectives to database
    for (const perspectiveData of perspectives) {
      const [perspective, created] = await Perspective.findOrCreate({
        where: { 
          userId,
          perspectiveName: perspectiveData.perspectiveName 
        },
        defaults: perspectiveData
      });

      if (!created) {
        await perspective.update(perspectiveData);
      }

      await UserPerspective.findOrCreate({
        where: { 
          userId, 
          perspectiveId: perspective.perspectiveId 
        }
      });
    }

    return perspectives;
  } catch (error) {
    console.error('Error generating Gmail perspectives:', error);
    throw error;
  }
}

async function searchEmails(gmail, query) {
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 100
  });

  const emails = [];
  if (response.data.messages) {
    for (const message of response.data.messages) {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id
      });
      emails.push(email.data);
    }
  }
  return emails;
}

function extractServiceName(email) {
  // Add logic to extract service name from email
  // This is a placeholder implementation
  const subject = email.payload.headers.find(h => h.name === 'Subject').value;
  const matches = subject.match(/subscription|receipt from (.*?)(:|$)/i);
  return matches ? matches[1].trim() : null;
}

function extractEventName(email) {
  // Add logic to extract event name from email
  // This is a placeholder implementation
  const subject = email.payload.headers.find(h => h.name === 'Subject').value;
  const matches = subject.match(/ticket|confirmation for (.*?)(:|$)/i);
  return matches ? matches[1].trim() : null;
}

module.exports = { generateGmailPerspectives }; 