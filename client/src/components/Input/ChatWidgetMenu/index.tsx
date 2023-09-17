import React from 'react';
import WritingAssistant from './WritingAssistant';
import CodingAssistant from './CodingAssistant';
import AskMeAnything from './AskMeAnything';
import DocChatbot from './DocChatbot';

export default function ChatWidget() {
  return(
    <>
      <WritingAssistant />
      <CodingAssistant />
      <AskMeAnything />
      <DocChatbot />
    </>
  );
}
