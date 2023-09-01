import React, { ReactNode, useState } from 'react';

export const ModalContext = React.createContext({});

const ConversationModalProvider = ({ children }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const value = {
    modalOpen,
    openModal,
    closeModal
  };

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
};

export default ConversationModalProvider;
