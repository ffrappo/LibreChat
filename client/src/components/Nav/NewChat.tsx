import React from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { useRecoilValue, useRecoilState } from 'recoil';
import { useParams } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { useAuthContext } from '~/hooks/AuthContext';
import store from '~/store';
import { useLocalize, useConversation, useNewConvo, useOriginNavigate } from '~/hooks';

export default function NewChat({ toggleNav }: { toggleNav: () => void }) {
  const { newConversation } = useConversation();
  const { newConversation: newConvo } = useNewConvo();
  const navigate = useOriginNavigate();
  const localize = useLocalize();
  const [widget, setWidget] = useRecoilState(store.widget); // eslint-disable-line
  const { user } = useAuthContext();
  const { userId } = useParams();

  const navigateToRegister = () => {
    if (!user && userId) {
      navigate(`/register/${userId}`);
    } else {
      navigate('/register');
    }
  };

  const clickHandler = () => {
    // dispatch(setInputValue(''));
    // dispatch(setQuery(''));
    setWidget('');
    newConvo();
    newConversation();
    navigate('new');
    toggleNav();
  };

  return (
    <a
      data-testid="new-chat-button"
      onClick={user ? clickHandler : navigateToRegister}
      className="flex h-11 flex-shrink-0 flex-grow cursor-pointer items-center gap-3 rounded-md border border-white/20 px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-500/10"
    >
      <svg
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        height="1em"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {localize('com_ui_new_chat')}
    </a>
  );
}
