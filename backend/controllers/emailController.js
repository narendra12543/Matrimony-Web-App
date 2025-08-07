import Subscriber from '../models/Subscriber.js';
import Email from '../models/Email.js';
import sendEmailWithAttachment from '../services/verificationemailService.js';

export const sendEmail = async (req, res) => {
  const { subject, content, type, target, targetEmail } = req.body;
  const files = req.files;

  try {
    let query = {};
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));

    switch (target) {
      case 'all':
        query = { 'subscriptions.platformUpdates': true, status: 'active' };
        break;
      case 'inactive':
        query = { status: 'active', lastLogin: { $lt: thirtyDaysAgo } };
        break;
      case 'specific':
        if (!targetEmail) {
          return res.status(400).json({ error: 'Target email is required for specific sends.' });
        }
        query = { email: targetEmail };
        break;
      default:
        const subType = type === 'newsletter' ? 'newsletter' : 'dailyRecommendations';
        query[`subscriptions.${subType}`] = true;
        query.status = 'active';
    }

    const subscribers = await Subscriber.find(query);

    if (subscribers.length === 0) {
      return res.status(404).json({ message: `No subscribers found for the specified target: ${target}.` });
    }

    const attachments = files ? files.map(file => ({
      filename: file.originalname,
      path: file.path,
      contentType: file.mimetype,
    })) : [];

    for (const sub of subscribers) {
      await sendEmailWithAttachment(sub.email, subject, content, attachments);
    }

    const newEmail = new Email({
      subject,
      content,
      type,
      attachments: files ? files.map(f => ({ filename: f.originalname, path: f.path, mimetype: f.mimetype })) : []
    });
    await newEmail.save();

    res.status(201).json({ message: `Email sent to ${subscribers.length} subscriber(s) and saved!`, email: newEmail });

  } catch (err) {
    console.error("Error in sendEmail:", err);
    res.status(500).json({ error: 'Failed to send or save email.' });
  }
};

export const getSentEmails = async (req, res) => {
  try {
    const emails = await Email.find().sort({ sentAt: -1 });
    res.status(200).json(emails);
  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching history.' });
  }
};

export const getSubscribers = async (req, res) => {
    try {
      const subscribers = await Subscriber.find().sort({ createdAt: -1 });
      res.status(200).json(subscribers);
    } catch (err) {
      res.status(500).json({ error: 'Server error while fetching subscribers.' });
    }
};

export const updateSubscriberPreferences = async (req, res) => {
  try {
    const { id } = req.params;
    const { subscriptions } = req.body;
    const updatedSubscriber = await Subscriber.findByIdAndUpdate(id, { $set: { subscriptions } }, { new: true });
    if (!updatedSubscriber) return res.status(404).json({ error: 'Subscriber not found.' });
    res.status(200).json(updatedSubscriber);
  } catch (err) {
    res.status(500).json({ error: 'Server error while updating preferences.' });
  }
};
