import { useGetUserByIdQuery } from 'librechat-data-provider';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { useLocalize, useConversation } from '~/hooks';
import { useAuthContext } from '~/hooks/AuthContext';

import store from '~/store';

export default function MobileNav({ setNavVisible }) {
  const conversation = useRecoilValue(store.conversation);
  const { newConversation } = useConversation();
  const localize = useLocalize();
  // const { title = 'New Chat' } = conversation || {};
  const [title, setTitle] = useState('New Chat');
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { userId = '' } = useParams();
  const [profileUser, setProfileUser] = useState({ username: '' });
  const [profileName, setProfileName] = useState('');

  const getUserByIdQuery = useGetUserByIdQuery(userId);

  useEffect(() => {
    getUserByIdQuery.refetch();
  }, [userId, getUserByIdQuery]);

  useEffect(() => {
    if (getUserByIdQuery.isSuccess) {
      setProfileUser(getUserByIdQuery.data);
    }
  }, [getUserByIdQuery.isSuccess, getUserByIdQuery.data]);

  useEffect(() => {
    if (!profileUser) {
      return;
    }
    if (user && user.id === userId) {
      setProfileName(localize('com_ui_homepage'));
    } else {
      setProfileName(localize('com_ui_others_homepage', profileUser.username));
    }
  }, [profileUser, userId, user, localize]);

  useEffect(() => {
    if (location.pathname === '/home') {
      setTitle(localize('com_ui_recommendation'));
    } else if (location.pathname === '/leaderboard') {
      setTitle(localize('com_ui_leaderboard'));
    } else if (location.pathname === '/chat/new') {
      setTitle(localize('com_ui_new_chat'));
    } else if (location.pathname.substring(0, 11) === '/chat/share') {
      setTitle(' ');
    } else if (location.pathname.substring(0, 8) === '/profile') {
      setTitle(profileName);
    } else if (conversation) {
      setTitle(conversation.title || localize('com_endpoint_new_topic'));
    } else {
      setTitle(localize('com_ui_new_chat'));
    }
  }, [conversation, profileName, localize]);

  return (
    <div className="fixed left-0 right-0 top-0 z-10 flex items-center border-b border-white/20 bg-gray-800 pl-1 pt-1 text-gray-200 sm:pl-3 md:hidden">
      <button
        type="button"
        className="-ml-0.5 -mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md hover:text-gray-900 focus:outline-none focus:ring-0 focus:ring-inset focus:ring-white dark:hover:text-white"
        onClick={() => setNavVisible((prev) => !prev)}
      >
        <span className="sr-only">{localize('com_nav_open_sidebar')}</span>
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <h1 className="flex-1 text-center text-base font-normal">
        {title || localize('com_ui_new_chat')}
      </h1>
      <button
        type="button"
        className="px-3"
        onClick={() => {
          newConversation();
          navigate('/c/new');
        }}
        title="Start a new chat"
      >
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
