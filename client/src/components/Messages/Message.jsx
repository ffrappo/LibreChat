/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import copy from 'copy-to-clipboard';
import Plugin from './Plugin.jsx';
import SubRow from './Content/SubRow';
import Content from './Content/Content';
import MultiMessage from './MultiMessage';
import HoverButtons from './HoverButtons';
import SiblingSwitch from './SiblingSwitch';
import getIcon from '~/utils/getIcon';
import { useMessageHandler } from '~/utils/handleSubmit';
import { useGetConversationByIdQuery } from '@librechat/data-provider';
import { cn } from '~/utils/';
import store from '~/store';
import getError from '~/utils/getError';
import { useAuthContext } from '../../hooks/AuthContext';
import { localize } from '~/localization/Translation';

export default function Message({
  conversation,
  message,
  scrollToBottom,
  currentEditId,
  setCurrentEditId,
  siblingIdx,
  siblingCount,
  setSiblingIdx,
  name = '',
  userId = '',
}) {
  const lang = useRecoilValue(store.lang);
  const { text, searchResult, isCreatedByUser, error, submitting, unfinished } = message;
  const isSubmitting = useRecoilValue(store.isSubmitting);
  const setLatestMessage = useSetRecoilState(store.latestMessage);
  const [abortScroll, setAbort] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true); // eslint-disable-line
  // const {isStopped, setStopped} = useState(false);
  // const {isPaused, setPaused} = useState(false);
  const synth = window.speechSynthesis;
  const textEditor = useRef(null);
  const last = !message?.children?.length;
  const edit = message.messageId == currentEditId;
  const { ask, regenerate } = useMessageHandler();
  const { switchToConversation } = store.useConversation();
  const blinker = submitting && isSubmitting;
  const getConversationQuery = useGetConversationByIdQuery(message.conversationId, {
    enabled: false
  });

  // debugging
  // useEffect(() => {
  //   console.log('isSubmitting:', isSubmitting);
  //   console.log('unfinished:', unfinished);
  // }, [isSubmitting, unfinished]);

  useEffect(() => {
    if (blinker && !abortScroll) {
      scrollToBottom();
    }
  }, [isSubmitting, blinker, text, scrollToBottom]);

  useEffect(() => {
    if (last) {
      setLatestMessage({ ...message });
    }
  }, [last, message]);

  const enterEdit = (cancel) => setCurrentEditId(cancel ? -1 : message.messageId);

  const handleWheel = () => {
    if (blinker) {
      setAbort(true);
    } else {
      setAbort(false);
    }
  };

  const props = {
    className:
      'w-full border-b border-black/10 dark:border-gray-900/50 text-gray-800 bg-white dark:text-gray-100 group dark:bg-gray-800'
  };

  const icon = getIcon({
    ...conversation,
    ...message,
    model: message?.model || conversation?.model,
    name,
    userId
  });

  if (!isCreatedByUser)
    props.className =
      'w-full border-b border-black/10 bg-gray-50 dark:border-gray-900/50 text-gray-800 dark:text-gray-100 group bg-gray-100 dark:bg-gray-1000';

  if (message.bg && searchResult) {
    props.className = message.bg.split('hover')[0];
    props.titleclass = message.bg.split(props.className)[1] + ' cursor-pointer';
  }

  const resubmitMessage = () => {
    const text = textEditor.current.innerText;

    ask({
      text,
      parentMessageId: message?.parentMessageId,
      conversationId: message?.conversationId
    });

    setSiblingIdx(siblingCount - 1);
    enterEdit(true);
  };

  const regenerateMessage = () => {
    if (!isSubmitting && !message?.isCreatedByUser) regenerate(message);
  };

  const copyToClipboard = (setIsCopied) => {
    setIsCopied(true);
    copy(message?.text);

    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  const speak = (msg, updateHoverButtons) => {
    let u = new SpeechSynthesisUtterance();
    u.lang = 'zh-CN';
    u.text = msg;
    u.cb = updateHoverButtons
    // console.log(msg);
    u.onend = (event) => {
      event.utterance.cb({ isStopped: true, isPaused: false });
    }
    synth.speak(u);
  };

  const pause = () => {
    synth.pause();
  }

  const resume = () => {
    synth.resume();
  }

  const stop = () => {
    synth.cancel();
  }

  const playbackMessage = (errorMessage, status, setStatus) => {
    let { isStopped, isPaused } = status;
    if (isStopped && (!isPaused)) {
      console.log('play 1: ' + isStopped + ' ' + isPaused)
      isStopped = false;
      setStatus({ isStopped, isPaused });
      if (error) {
        // let errmsg = getError(text);
        // console.log(getError(text))
        speak(errorMessage, setStatus);
      } else {
        speak(text, setStatus);
      }
    } else if ((!isStopped) && (!isPaused)) {
      console.log('play 2: ' + isStopped + ' ' + isPaused)
      isPaused = true;
      setStatus({ isStopped, isPaused });
      pause();
    } else if ((!isStopped) && isPaused) {
      console.log('play 3: ' + isStopped + ' ' + isPaused)
      isPaused = false;
      setStatus({ isStopped, isPaused });
      resume();
    } else {
      console.log('play 4: ' + isStopped + ' ' + isPaused)
      console.log('paly back status: ' + isStopped + ' ' + isPaused);
    }
  };

  const stopPlaybackMessage = (status, setStatus) => {
    let { isStopped, isPaused } = status;
    if (isStopped) {
      console.log('stop 1: ' + isStopped + ' ' + isPaused)
      // pass
    } else {
      console.log('stop 2: ' + isStopped + ' ' + isPaused)
      isStopped = true;
      isPaused = false;
      setStatus({ isStopped, isPaused });
      stop();
    }
  };

  const { token } = useAuthContext();

  // initial fetch to find out if it is being liked
  const fetchLikeStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/messages/${message.conversationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        } }
      )

      const data = await response.json();
      // Assuming 'data' is an array of message objects
      data.forEach(item => {
      // Assuming each message object has a 'messageId' and 'likesMsg' property
        const messageId = item.messageId;
        const isLiked = item.likesMsg;
        if (messageId === message.messageId) {
          setIsLiked(isLiked);
        }
      });
      setLoading(false)
      // setIsLiked(data.isLiked);
      // console.log('dataaaaaaa', data.likesConvo);
      // Update the isLiked state based on the data received from the API
      // setIsLiked();
    } catch (error) {
      console.log('Error fetching like status:', error);
    }
  };

  useEffect(() => {
    fetchLikeStatus();
  }, []);

  const handleLikeClick = async () => {
    try {
      const response = await fetch('/api/messages/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId: message.messageId,
          isLiked: !isLiked
        })
      });
      const data = await response.json();
      if (data.message) {
        console.log(data.message);
        return;
      }
      // Update the isLiked state based on the API response
      setIsLiked((prev) => !prev);
    } catch (error) {
      console.log('Error liking message:', error);
    }
  };

  const clickSearchResult = async () => {
    if (!searchResult) return;
    getConversationQuery.refetch(message.conversationId).then((response) => {
      switchToConversation(response.data);
    });
  };

  return (
    <>
      <div {...props} onWheel={handleWheel}>
        <div className="relative m-auto flex gap-4 p-4 text-base md:max-w-2xl md:gap-6 md:py-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
          <div className="relative flex h-[30px] w-[30px] flex-col items-end text-right text-xs md:text-sm">
            {typeof icon === 'string' && icon.match(/[^\\x00-\\x7F]+/) ? (
              <span className=" direction-rtl w-40 overflow-x-scroll">{icon}</span>
            ) : (
              icon
            )}
            <div className="sibling-switch invisible absolute left-0 top-2 -ml-4 flex -translate-x-full items-center justify-center gap-1 text-xs group-hover:visible">
              <SiblingSwitch
                siblingIdx={siblingIdx}
                siblingCount={siblingCount}
                setSiblingIdx={setSiblingIdx}
              />
            </div>
          </div>
          <div className="relative flex w-[calc(100%-50px)] flex-col gap-1  md:gap-3 lg:w-[calc(100%-115px)]">
            {searchResult && (
              <SubRow
                classes={props.titleclass + ' rounded'}
                subclasses="switch-result pl-2 pb-2"
                onClick={clickSearchResult}
              >
                <strong>{`${message.title} | ${message.sender}`}</strong>
              </SubRow>
            )}
            <div className="flex flex-grow flex-col gap-3">
              {message.plugin && <Plugin plugin={message.plugin} />}
              {error ? (
                <div className="flex flex min-h-[20px] flex-grow flex-col items-start gap-2 gap-4  text-red-500">
                  <div className="rounded-md border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-gray-600 dark:text-gray-100">
                    {getError(text)}
                  </div>
                </div>
              ) : edit ? (
                <div className="flex min-h-[20px] flex-grow flex-col items-start gap-4 ">
                  {/* <div className={`${blinker ? 'result-streaming' : ''} markdown prose dark:prose-invert light w-full break-words`}> */}
                  <div
                    className="markdown prose dark:prose-invert light w-full whitespace-pre-wrap break-words border-none focus:outline-none"
                    contentEditable={true}
                    ref={textEditor}
                    suppressContentEditableWarning={true}
                  >
                    {text}
                  </div>
                  <div className="mt-2 flex w-full justify-center text-center">
                    <button
                      className="btn btn-primary relative mr-2"
                      disabled={isSubmitting}
                      onClick={resubmitMessage}
                    >
                      {localize(lang, 'com_msg_save_submit')}
                    </button>
                    <button className="btn btn-neutral relative" onClick={() => enterEdit(true)}>
                      {localize(lang, 'com_msg_cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={cn(
                      'flex min-h-[20px] flex-grow flex-col items-start gap-4 ',
                      isCreatedByUser ? 'whitespace-pre-wrap' : ''
                    )}
                  >
                    {/* <div className={`${blinker ? 'result-streaming' : ''} markdown prose dark:prose-invert light w-full break-words`}> */}
                    <div className="markdown prose dark:prose-invert light w-full break-words">
                      {!isCreatedByUser ? (
                        <>
                          <Content content={text} message={message} />
                        </>
                      ) : (
                        <>{text}</>
                      )}
                    </div>
                  </div>
                  {/* {!isSubmitting && cancelled ? (
                    <div className="flex flex min-h-[20px] flex-grow flex-col items-start gap-2 gap-4  text-red-500">
                      <div className="rounded-md border border-blue-400 bg-blue-500/10 px-3 py-2 text-sm text-gray-600 dark:text-gray-100">
                        {`This is a cancelled message.`}
                      </div>
                    </div>
                  ) : null} */}
                  {!isSubmitting && unfinished ? (
                    <div className="flex flex min-h-[20px] flex-grow flex-col items-start gap-2 gap-4  text-red-500">
                      <div className="rounded-md border border-blue-400 bg-blue-500/10 px-3 py-2 text-sm text-gray-600 dark:text-gray-100">
                        {'This is an unfinished message. The AI may still be generating a response or it was aborted. Refresh or visit later to see more updates.'}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <HoverButtons
              error={getError(text)}
              isEditting={edit}
              isSubmitting={isSubmitting}
              message={message}
              conversation={conversation}
              enterEdit={() => enterEdit()}
              regenerate={() => regenerateMessage()}
              copyToClipboard={copyToClipboard}
              handleLikeClick={handleLikeClick}
              isLiked={isLiked}
              playbackMessage={playbackMessage}
              stopPlaybackMessage={stopPlaybackMessage}
            />

            <SubRow subclasses="switch-container">
              <SiblingSwitch
                siblingIdx={siblingIdx}
                siblingCount={siblingCount}
                setSiblingIdx={setSiblingIdx}
              />
            </SubRow>
          </div>
        </div>
      </div>
      <MultiMessage
        messageId={message.messageId}
        conversation={conversation}
        messagesTree={message.children}
        scrollToBottom={scrollToBottom}
        currentEditId={currentEditId}
        setCurrentEditId={setCurrentEditId}
        name={name}
        userId={userId}
      />
    </>
  );
}
