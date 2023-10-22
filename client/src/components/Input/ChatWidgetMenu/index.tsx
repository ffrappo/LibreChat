import React from 'react';
import WritingAssistant from './WritingAssistant';
import CodingAssistant from './CodingAssistant';
import AskMeAnything from './AskMeAnything';
import DocAssistant from './DocAssistant';

export default function ChatWidget() {
  return(
    <>
      <WritingAssistant />
      <CodingAssistant />
      <AskMeAnything />
      <DocAssistant />
    </>
  );
}
