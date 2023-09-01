export const formatUsernames = (participants, myUserId) => {
  const usernames = participants.filter((participant) => participant.user.id != myUserId).map((participant) => participant.user.username);

  return usernames.join(', ');
};

export const formatImages = (participants, myUserId) => {
  const images = participants.filter((participant) => participant.user.id != myUserId).map((participant) => participant.user.image);

  return images.join(', ');
};
