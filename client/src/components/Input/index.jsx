import React, { useEffect, useRef, useState } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import SubmitButton from './SubmitButton';
import OpenAIOptions from './OpenAIOptions';
import PluginsOptions from './PluginsOptions';
import ChatGPTOptions from './ChatGPTOptions';
import BingAIOptions from './BingAIOptions';
import GoogleOptions from './GoogleOptions';
import AdjustToneButton from './AdjustToneButton';
import Footer from './Footer';
import TextareaAutosize from 'react-textarea-autosize';
import { useMessageHandler } from '../../utils/handleSubmit';

import store from '~/store';
import NewConversationMenu from './NewConversationMenu';
import ChatWidget from './ChatWidgetMenu';
import { localize } from '~/localization/Translation';
import { useAuthContext } from '~/hooks/AuthContext';

export default function TextChat({ isSearchView = false }) {
  const lang = useRecoilValue(store.lang);
  const inputRef = useRef(null);
  const isComposing = useRef(false);

  const conversation = useRecoilValue(store.conversation);
  const latestMessage = useRecoilValue(store.latestMessage);
  const [text, setText] = useRecoilState(store.text);

  const endpointsConfig = useRecoilValue(store.endpointsConfig);
  const isSubmitting = useRecoilValue(store.isSubmitting);

  // TODO: do we need this?
  const disabled = false;

  const { user } = useAuthContext();
  const { ask, stopGenerating } = useMessageHandler();
  const [showBingToneSetting, setShowBingToneSetting] = useState(false);

  const isNotAppendable = latestMessage?.unfinished & !isSubmitting || latestMessage?.error;

  // auto focus to input, when enter a conversation.
  useEffect(() => {
    if (conversation?.conversationId !== 'search') inputRef.current?.focus();
  }, [conversation?.conversationId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isSubmitting]);

  const submitMessage = () => {
    // Deduct 200 credits if using gpt-4
    // Assumes that user has more than 200 credits
    if (conversation.model === 'gpt-4') {
      user.creditBalance = user.creditBalance - 200;
    }

    ask({ text });
    setText('');
  };

  const handleStopGenerating = (e) => {
    e.preventDefault();
    stopGenerating();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isSubmitting) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }

    if (e.key === 'Enter' && !e.shiftKey && !isComposing?.current) {
      submitMessage();
    }
  };

  const handleKeyUp = (e) => {
    if (e.keyCode === 8 && e.target.value.trim() === '') {
      setText(e.target.value);
    }

    if (e.key === 'Enter' && e.shiftKey) {
      return console.log('Enter + Shift');
    }

    if (isSubmitting) {
      return;
    }
  };

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = () => {
    isComposing.current = false;
  };

  const changeHandler = (e) => {
    const { value } = e.target;

    setText(value);
  };

  const getPlaceholderText = () => {
    if (isSearchView) {
      return localize(lang, 'com_msg_open_conversation');
    }

    if (disabled) {
      return localize(lang, 'com_msg_choose_another_model');
    }

    if (isNotAppendable) {
      return localize(lang, 'com_msg_edit_message');
    }

    return '';
  };

  const handleBingToneSetting = () => {
    setShowBingToneSetting((show) => !show);
  };

  if (isSearchView) return <></>;

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full md:absolute">
        <div className="flex flex-row relative py-2 md:mb-[-16px] md:py-4 lg:mb-[-32px]">
          <span className="flex flex-row w-full items-center justify-center gap-0 md:order-none md:m-auto md:gap-2">
            <OpenAIOptions />
            <PluginsOptions />
            <ChatGPTOptions />
            <GoogleOptions />
            <BingAIOptions show={showBingToneSetting} />
            <ChatWidget />
          </span>
        </div>
        <div className="input-panel md:bg-vert-light-gradient dark:md:bg-vert-dark-gradient relative w-full border-t bg-white py-2 dark:border-white/20 dark:bg-gray-800 md:border-t-0 md:border-transparent md:bg-transparent md:dark:border-transparent md:dark:bg-transparent">
          <form className="stretch mx-2 flex flex-row gap-3 last:mb-2 md:pt-2 md:last:mb-6 lg:mx-auto lg:max-w-3xl lg:pt-6">
            <div className="relative flex h-full flex-1 md:flex-col">
              <div
                className={`relative flex flex-grow flex-row rounded-md border border-black/10 ${
                  disabled ? 'bg-gray-100' : 'bg-white'
                } py-2 shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-gray-900/50 ${
                  disabled ? 'dark:bg-gray-900' : 'dark:bg-gray-700'
                } dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] md:py-3 md:pl-4`}
              >
                <NewConversationMenu />
                <TextareaAutosize
                // set test id for e2e testing
                  data-testid="text-input"
                  tabIndex="0"
                  autoFocus
                  ref={inputRef}
                  // style={{maxHeight: '200px', height: '24px', overflowY: 'hidden'}}
                  rows="1"
                  value={disabled || isNotAppendable ? '' : text}
                  onKeyUp={handleKeyUp}
                  onKeyDown={handleKeyDown}
                  onChange={changeHandler}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  placeholder={getPlaceholderText()}
                  disabled={disabled || isNotAppendable}
                  className="m-0 flex h-auto max-h-52 flex-1 resize-none overflow-auto border-0 bg-transparent p-0 pl-2 pr-12 leading-6 placeholder:text-sm placeholder:text-gray-600 focus:outline-none focus:ring-0 focus-visible:ring-0 dark:bg-transparent dark:placeholder:text-gray-500 md:pl-2"
                />
                {/*Disable gpt-4 submission if less than 200 credit balance */}
                <SubmitButton
                  submitMessage={submitMessage}
                  handleStopGenerating={handleStopGenerating}
                  disabled={disabled || isNotAppendable || (conversation.model === 'gpt-4' && user.creditBalance < 200)}
                  isSubmitting={isSubmitting}
                  endpointsConfig={endpointsConfig}
                  endpoint={conversation?.endpoint}
                />
                {latestMessage && conversation?.jailbreak && conversation.endpoint === 'bingAI' ? (
                  <AdjustToneButton onClick={handleBingToneSetting} />
                ) : null}
              </div>
            </div>
          </form>
          <Footer />
        </div>
      </div>
    </>
  );
}
