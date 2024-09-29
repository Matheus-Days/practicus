'use client';

import { ReactNode, useState } from 'react';
import BasicButton from './BasicButton';
import ReactModal from 'react-modal';
import MaterialCard from './MaterialCard';

const customStyles: ReactModal.Styles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    border: 'none',
    padding: '0',
    boxShadow: "0px 4px 4px 0px #52818A40"
  },
  overlay: {
    zIndex: 20
  }
};

ReactModal.setAppElement('#app');

type ReadMoreProps = {
  children: ReactNode;
  buttonLabel: string;
};

export default function ReadMore({ buttonLabel, children }: ReadMoreProps) {
  const [show, setShow] = useState(false);

  return (
    <span>
      <BasicButton onClick={() => setShow(true)}>{buttonLabel}</BasicButton>
      <ReactModal
        isOpen={show}
        onRequestClose={() => setShow(false)}
        style={customStyles}
      >
        <MaterialCard
          onClose={() => setShow(false)}
          onClick={(ev) => ev.stopPropagation()}
        >
          {children}
        </MaterialCard>
      </ReactModal>
    </span>
  );
}
