import React, { useState } from 'react';
import ViewProfile from './User_Profile/ViewProfile';
import CreateProfile from './User_Profile/CreateProfile';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleView = () => {
    setIsEditing(false);
  };

  return (
    <div>
      {isEditing ? (
        <CreateProfile onProfileCreated={handleView} />
      ) : (
        <ViewProfile onEdit={handleEdit} />
      )}
    </div>
  );
};

export default Profile;
