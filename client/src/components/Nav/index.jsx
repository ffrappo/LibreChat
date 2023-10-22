/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGetConversationsQuery, useSearchQuery } from '@librechat/data-provider';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

import Conversations from '../Conversations';
import NavLinks from './NavLinks';
import NewChat from './NewChat';
import Pages from '../Conversations/Pages';
import Panel from '../svg/Panel';
import Spinner from '../svg/Spinner';
import { cn } from '~/utils/';
import store from '~/store';
import { useAuthContext } from '~/hooks/AuthContext';
import NavLink from './NavLink';
import CheckMark from '../svg/CheckMark';
import Clipboard from '../svg/Clipboard';
import useDebounce from '~/hooks/useDebounce';
import LeaderboardIcon from '../svg/LeaderboardIcon';
import NotebookIcon from '../svg/NotebookIcon';
import { useNavigate, useParams } from 'react-router-dom';
import HomeIcon from '../svg/HomeIcon';
import LightBulbIcon from '../svg/LightBulbIcon';
import ComputerIcon from '../svg/ComputerIcon';
import ProfileIcon from '../svg/UserIcon';
import { localize } from '~/localization/Translation';

// import resolveConfig from 'tailwindcss/resolveConfig';
// const tailwindConfig = import('../../../tailwind.config.cjs');
// const fullConfig = resolveConfig(tailwindConfig);

// export const getBreakpointValue = (value) =>
//   +fullConfig.theme.screens[value].slice(0, fullConfig.theme.screens[value].indexOf('px'));

// export const getCurrentBreakpoint = () => {
//   let currentBreakpoint;
//   let biggestBreakpointValue = 0;
//   for (const breakpoint of Object.keys(fullConfig.theme.screens)) {
//     const breakpointValue = getBreakpointValue(breakpoint);
//     if (breakpointValue > biggestBreakpointValue && window.innerWidth >= breakpointValue) {
//       biggestBreakpointValue = breakpointValue;
//       currentBreakpoint = breakpoint;
//     }
//   }
//   return currentBreakpoint;
// };

export default function Nav({ navVisible, setNavVisible }) {
  const [isHovering, setIsHovering] = useState(false);
  const { isAuthenticated } = useAuthContext();
  const containerRef = useRef(null);
  const scrollPositionRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  // current page
  const [pageNumber, setPageNumber] = useState(1);
  // total pages
  const [pages, setPages] = useState(1);

  // data provider
  const getConversationsQuery = useGetConversationsQuery(pageNumber, { enabled: isAuthenticated });

  // language
  const lang = useRecoilValue(store.lang);

  // search
  const searchQuery = useRecoilValue(store.searchQuery);
  const isSearchEnabled = useRecoilValue(store.isSearchEnabled);
  const isSearching = useRecoilValue(store.isSearching);
  const { newConversation, searchPlaceholderConversation } = store.useConversation();

  // current conversation
  const conversation = useRecoilValue(store.conversation);
  const { conversationId } = conversation || {};
  const setSearchResultMessages = useSetRecoilState(store.searchResultMessages);
  const refreshConversationsHint = useRecoilValue(store.refreshConversationsHint);
  const { refreshConversations } = store.useConversations();

  const [isFetching, setIsFetching] = useState(false);

  const [refLink, setRefLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [widget, setWidget] = useRecoilState(store.widget);
  const { user } = useAuthContext();
  const { userId } = useParams();
  const navigate = useNavigate();

  const debouncedSearchTerm = useDebounce(searchQuery, 750);
  const searchQueryFn = useSearchQuery(debouncedSearchTerm, pageNumber, {
    enabled:
      !!debouncedSearchTerm && debouncedSearchTerm.length > 0 && isSearchEnabled && isSearching
  });

  const onSearchSuccess = (data, expectedPage) => {
    const res = data;
    setConversations(res.conversations);
    if (expectedPage) {
      setPageNumber(expectedPage);
    }
    setPages(res.pages);
    setIsFetching(false);
    searchPlaceholderConversation();
    setSearchResultMessages(res.messages);
  };

  useEffect(() => {
    //we use isInitialLoading here instead of isLoading because query is disabled by default
    if (searchQueryFn.isInitialLoading) {
      setIsFetching(true);
    } else if (searchQueryFn.data) {
      onSearchSuccess(searchQueryFn.data);
    }
  }, [searchQueryFn.data, searchQueryFn.isInitialLoading]);

  const clearSearch = () => {
    setPageNumber(1);
    refreshConversations();
    if (conversationId == 'search') {
      newConversation();
    }
  };

  const moveToTop = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      scrollPositionRef.current = container.scrollTop;
    }
  }, [containerRef, scrollPositionRef]);

  const nextPage = async () => {
    moveToTop();
    setPageNumber(pageNumber + 1);
  };

  const previousPage = async () => {
    moveToTop();
    setPageNumber(pageNumber - 1);
  };

  useEffect(() => {
    if (getConversationsQuery.data) {
      if (isSearching) {
        return;
      }
      let { conversations, pages } = getConversationsQuery.data;
      if (pageNumber > pages) {
        setPageNumber(pages);
      } else {
        if (!isSearching) {
          conversations = conversations.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
        }
        setConversations(conversations);
        setPages(pages);
      }
    }
  }, [getConversationsQuery.isSuccess, getConversationsQuery.data, isSearching, pageNumber]);

  useEffect(() => {
    if (!isSearching) {
      getConversationsQuery.refetch();
    }
  }, [pageNumber, conversationId, refreshConversationsHint]);

  const toggleNavVisible = () => {
    setNavVisible((prev) => !prev);
  };

  // useEffect(() => {
  //   let currentBreakpoint = getCurrentBreakpoint();
  //   if (currentBreakpoint === 'sm') {
  //     setNavVisible(false);
  //   } else {
  //     setNavVisible(true);
  //   }
  // }, [conversationId, setNavVisible]);

  const isMobile = () => {
    const userAgent = typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    return mobileRegex.test(userAgent);
  };

  useEffect(() => {
    if (isMobile()) {
      setNavVisible(false);
    }
  }, [conversationId, setNavVisible, widget, location.pathname]);

  const copyLinkHandler = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
  }

  const navigateToRegister = () => {
    if (!user && userId) {
      navigate(`/register/${userId}`);
    } else {
      navigate('/register');
    }
  }

  const openWidgetHandler = (type) => () => {
    if (location.pathname.substring(1, 5) !== 'chat' || location.pathname.substring(0, 11) === '/chat/share') {
      newConversation();
      navigate('/chat/new');
      setWidget(`${type}`);
    } else {
      setWidget(widget === `${type}` ? '' : `${type}`);
    }
  }

  const openWritingAssistantHandler = openWidgetHandler('wa');
  const openCodingAssistantHandler = openWidgetHandler('ca');
  const openDocAssistantHandler = openWidgetHandler('docassist');
  const openAskMeAnythingHandler = openWidgetHandler('ama');
  const openLeaderboardHandler = () => navigate('/leaderboard');
  const openHomepageHandler = () => navigate('/home');
  const openProfileHandler = () => navigate(`/profile/${user.id}`);

  useEffect(() => {
    if (user) setRefLink(window.location.protocol + '//' + window.location.host +`/register/${user.id}`);
  }, [user]);

  useEffect(() => {
    setTimeout(() => {
      if (copied) setCopied(!copied);
    }, 2000);
  }, [copied])

  const containerClasses =
    getConversationsQuery.isLoading && pageNumber === 1
      ? 'flex flex-col gap-2 text-gray-100 text-sm h-full justify-center items-center'
      : 'flex flex-col gap-2 text-gray-100 text-sm';

  return (
    <>
      <div className={'nav dark bg-gray-900 md:inset-y-0' + (navVisible ? ' active' : '')}>
        <div className="flex h-full min-h-0 flex-col ">
          <div className="scrollbar-trigger relative flex h-full w-full flex-1 items-start border-white/20">
            <nav className="relative flex h-full flex-1 flex-col space-y-1 p-2">
              <div className='flex flex-row h-11'>
                <NewChat />
                <button
                  type='button'
                  className={cn('nav-close-button inline-flex h-11 w-11 border border-white/20 items-center justify-center rounded-md text-white hover:bg-gray-500/10')}
                  onClick={toggleNavVisible}
                >
                  <span className='sr-only'>Close sidebar</span>
                  <Panel open={false} />
                </button>
              </div>
              <div
                className={`flex-1 flex-col overflow-y-auto ${isHovering ? '' : 'scrollbar-transparent'
                } border-b border-white/20`}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                ref={containerRef}
              >
                {!user && <div className='flex flex-col h-full justify-center items-center' style={{ color: 'white' }}>
                  <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-32 w-32"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <button className='font-bold hover:underline' onClick={ navigateToRegister }>
                    {localize(lang, 'com_ui_register_here')}
                  </button>
                </div>}
                {user && <div className={containerClasses}>
                  {(getConversationsQuery.isLoading && pageNumber === 1) || isFetching ? (
                    <Spinner />
                  ) : (
                    <Conversations
                      conversations={conversations}
                      conversationId={conversationId}
                      moveToTop={moveToTop}
                    />
                  )}
                  <Pages
                    pageNumber={pageNumber}
                    pages={pages}
                    nextPage={nextPage}
                    previousPage={previousPage}
                  />
                </div>}
              </div>
              {user && (
                <NavLink
                  className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                  // Add an SVG or icon for the Profile link here
                  svg={() => <ProfileIcon />}
                  text={localize(lang, 'com_ui_homepage')}
                  clickHandler={ openProfileHandler }
                />
              )}
              <NavLink
                className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                svg={() => <HomeIcon />}
                text={localize(lang, 'com_ui_recommendation')}
                clickHandler={ user ? openHomepageHandler : navigateToRegister }
              />
              <NavLink
                className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                svg={() => <NotebookIcon />}
                text={localize(lang, 'com_ui_writing_assistant')}
                clickHandler={ user ? openWritingAssistantHandler : navigateToRegister }
              />
              <NavLink
                className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                svg={() => <ComputerIcon />}
                text={localize(lang, 'com_ui_coding_assistant')}
                clickHandler={ user ? openCodingAssistantHandler : navigateToRegister }
              />
              <NavLink
                className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                svg={() => <ComputerIcon />}
                text={localize(lang, 'com_ui_doc_assist')}
                clickHandler={ user ? openDocAssistantHandler : navigateToRegister }
              />
              <NavLink
                className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                svg={() => <LightBulbIcon />}
                text={localize(lang, 'com_ui_ask_me_anything')}
                clickHandler={ user ? openAskMeAnythingHandler : navigateToRegister }
              />
              <NavLink
                className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                svg={() => <LeaderboardIcon />}
                text={localize(lang, 'com_ui_referrals_leaderboard')}
                clickHandler={ user ? openLeaderboardHandler : navigateToRegister }
              />
              <NavLink
                className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                svg={() => copied ? <CheckMark /> : <Clipboard />}
                text={copied ? (
                  localize(lang, 'com_ui_copied_success')
                ) : (
                  localize(lang, 'com_ui_copy_invitation_link')
                )}
                clickHandler={ user ? copyLinkHandler : navigateToRegister }
              />
              <NavLinks clearSearch={clearSearch} isSearchEnabled={isSearchEnabled} />
            </nav>
          </div>
        </div>
      </div>
      {!navVisible && (
        <button
          type="button"
          className="nav-open-button mt-1 fixed left-2 top-0.5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-md border border-black/10 dark:border-white/20 bg-white dark:bg-gray-800 text-black hover:text-gray-500 dark:text-white dark:hover:text-gray-400"
          onClick={toggleNavVisible}
        >
          <div className="flex items-center justify-center">
            <span className="sr-only">{localize(lang, 'com_nav_open_sidebar')}</span>
            <Panel open={true} />
          </div>
        </button>
      )}
      <div className={'nav-mask' + (navVisible ? ' active' : '')} onClick={toggleNavVisible}></div>
    </>
  );
}
