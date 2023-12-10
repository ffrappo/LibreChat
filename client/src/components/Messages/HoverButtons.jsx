import React from 'react';
import { cn } from '~/utils/';
import Clipboard from '../svg/Clipboard';
import CheckMark from '../svg/CheckMark';
import EditIcon from '../svg/EditIcon';
import LikeIcon from '../svg/LikeIcon';
import RegenerateIcon from '../svg/RegenerateIcon';
import EyeIcon from '../svg/EyeIcon';
import store from '~/store';
import { useRecoilValue } from 'recoil';
import { localize } from '~/localization/Translation';
import LightBulbIcon from '../svg/LightBulbIcon';
import { MessagesSquared } from '../svg';
import LightningIcon from '../svg/LightningIcon';

export default function HoverButtons({
  error,
  isEditting,
  enterEdit,
  copyToClipboard,
  handleLikeClick,
  conversation,
  isSubmitting,
  isLiked,
  message,
  regenerate,
  playbackMessage,
  stopPlaybackMessage
}) {
  const lang = useRecoilValue(store.lang);
  const { endpoint } = conversation;
  const [isCopied, setIsCopied] = React.useState(false);
  const [playbackStatus, setPlaybackStatus] = React.useState({ isPaused: false, isStopped: true });

  const branchingSupported =
    // azureOpenAI, openAI, chatGPTBrowser support branching, so edit enabled // 5/21/23: Bing is allowing editing and Message regenerating
    !!['azureOpenAI', 'openAI', 'chatGPTBrowser', 'google', 'bingAI', 'gptPlugins'].find(
      (e) => e === endpoint
    );
  // Sydney in bingAI supports branching, so edit enabled

  const editEnabled =
    !message?.error &&
    message?.isCreatedByUser &&
    !message?.searchResult &&
    !isEditting &&
    branchingSupported;

  // for now, once branching is supported, regerate will be enabled
  let regenerateEnabled =
    // !message?.error &&
    !message?.isCreatedByUser &&
    !message?.searchResult &&
    !isEditting &&
    !isSubmitting &&
    branchingSupported;

  return (
    <div className="visible mt-2 flex justify-center gap-3 self-end text-gray-400 md:gap-4 lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:translate-x-full lg:gap-1 lg:self-center lg:pl-2">
      {editEnabled ? (
        <button
          className="hover-button rounded-md p-1 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:invisible md:group-hover:visible"
          onClick={enterEdit}
          type="button"
          title={localize(lang, 'com_msg_edit')}
        >
          {/* <button className="rounded-md p-1 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400"> */}
          <EditIcon />
        </button>

      ) : null}
      {regenerateEnabled ? (
        <>
          <button
            className="hover-button rounded-md p-1 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400"
            onClick={handleLikeClick}
            type="button"
            title={isLiked ? 'Unlike' : 'Like'}
          >
            <LikeIcon filled={isLiked} style={{ marginTop: '0' }}/>
          </button>

          <button
            className="hover-button active rounded-md p-1 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:invisible md:group-hover:visible"
            onClick={regenerate}
            type="button"
            title="regenerate"
          >
            {/* <button className="rounded-md p-1 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400"> */}
            <RegenerateIcon />
          </button>
        </>
      ) : null}

      <button
        className={cn(
          'hover-button rounded-md p-1 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:invisible md:group-hover:visible',
          message?.isCreatedByUser ? '' : 'active'
        )}
        onClick={() => copyToClipboard(setIsCopied)}
        type="button"
        title={isCopied ? localize(lang,'com_msg_copied_to_clipboard') : localize(lang, 'com_msg_copy_to_clipboard')}
      >
        {isCopied ? <CheckMark /> : <Clipboard />}
      </button>

      <br/>
      <button
        className="hover-button active rounded-md p-1 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:invisible md:group-hover:visible"
        onClick={() => playbackMessage(error, playbackStatus, setPlaybackStatus)}
        type="button"
        title={playbackStatus.isPaused ? localize(lang, 'com_msg_playback') : '暂停播放'}
      >
        {(playbackStatus.isStopped && (!playbackStatus.isPaused)) ||
          ((!playbackStatus.isStopped) && playbackStatus.isPaused) ||
          (playbackStatus.isStopped && (!playbackStatus.isPaused))
          ? <EyeIcon /> : <LightBulbIcon/> }
      </button>
      <button
        className="hover-button active rounded-md p-1 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:invisible md:group-hover:visible"
        onClick={() => stopPlaybackMessage(playbackStatus, setPlaybackStatus)}
        type="button"
        title={playbackStatus.isPaused ? localize(lang, 'com_msg_playback') : '暂停播放'}
      >
        { !playbackStatus.isStopped ? <MessagesSquared /> : <LightningIcon/> }
      </button>
    </div>
  );
}
