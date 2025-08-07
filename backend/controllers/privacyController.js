import User from "../models/User.js";

export const getPrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("privacy");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ privacy: user.privacy });
  } catch (error) {
    console.error("Error fetching user privacy-settings:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const updatePrivacySettings = async (req, res) => {
  try {
    const { profileVisibility, contactVisibility, dataUsage, marketingCommunications } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          "privacy.profileVisibility": profileVisibility,
          "privacy.contactVisibility": contactVisibility,
          "privacy.dataUsage": dataUsage,
          "privacy.marketingCommunications": marketingCommunications,
        },
      },
      { new: true }
    ).select("privacy");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Privacy settings updated", privacy: updatedUser.privacy });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
