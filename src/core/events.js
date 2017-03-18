module.exports = {
  // fired before MediaSource is attaching to media element - data: { media }
  MEDIA_ATTACHING: 'avplayerMediaAttaching',
  // fired when MediaSource has been succesfully attached to media element - data: { }
  MEDIA_ATTACHED: 'avplayerMediaAttached',
  // fired before detaching MediaSource from media element - data: { }
  MEDIA_DETACHING: 'avplayerMediaDetaching',
  // fired when MediaSource has been detached from media element - data: { }
  MEDIA_DETACHED: 'avplayerMediaDetached',
  // fired when we buffer is going to be resetted
  BUFFER_RESET: 'avplayerBufferReset',
  // fired when we know about the codecs that we need buffers for to push into - data: {tracks : { container, codec, levelCodec, initSegment, metadata }}
  BUFFER_CODECS: 'avplayerBufferCodecs',
  // fired when sourcebuffers have been created data: { tracks : tracks}
  BUFFER_CREATED: 'avplayerBufferCreated',
  // fired when we append a segment to the buffer - data: { segment: segment object }
  BUFFER_APPENDING: 'avplayerBufferAppending',
  // fired when we are done with appending a media segment to the buffer data : { parent : segment parent that triggered BUFFER_APPENDING , pending : nb of segments waiting for appending for this segment parent}
  BUFFER_APPENDED: 'avplayerBufferAppended',
  // fired when the stream is finished and we want to notify the media buffer that there will be no more data
  BUFFER_EOS: 'avplayerBufferEos',
  // fired when the media buffer should be flushed - data {startOffset, endOffset}
  BUFFER_FLUSHING: 'avplayerBufferFlushing',
  // fired when the media has been flushed
  BUFFER_FLUSHED: 'avplayerBufferFlushed',
  // fired to signal that a manifest loading starts - data: { url : manifestURL}
  MANIFEST_LOADING: 'avplayerManifestLoading',
  // fired after manifest has been loaded - data: { levels : [available quality levels] , audioTracks : [ available audio tracks], url : manifestURL, stats : { trequest, tfirst, tload, mtime}}
  MANIFEST_LOADED: 'avplayerManifestLoaded',
  // fired after manifest has been parsed - data: { levels : [available quality levels] , firstLevel : index of first quality level appearing in Manifest}
  MANIFEST_PARSED: 'avplayerManifestParsed',
  // fired when a level switch is requested - data: { level : id of new level } // deprecated in favor LEVEL_SWITCHING
  LEVEL_SWITCH: 'avplayerLevelSwitch',
  // fired when a level switch is requested - data: { level : id of new level }
  LEVEL_SWITCHING: 'avplayerLevelSwitching',
  // fired when a level switch is effective - data: { level : id of new level }
  LEVEL_SWITCHED: 'avplayerLevelSwitched',
  // fired when a level playlist loading starts - data: { url : level URL  level : id of level being loaded}
  LEVEL_LOADING: 'avplayerLevelLoading',
  // fired when a level playlist loading finishes - data: { details : levelDetails object, level : id of loaded level, stats : { trequest, tfirst, tload, mtime} }
  LEVEL_LOADED: 'avplayerLevelLoaded',
  // fired when a level's details have been updated based on previous details, after it has been loaded. - data: { details : levelDetails object, level : id of updated level }
  LEVEL_UPDATED: 'avplayerLevelUpdated',
  // fired when a level's PTS information has been updated after parsing a fragment - data: { details : levelDetails object, level : id of updated level, drift: PTS drift observed when parsing last fragment }
  LEVEL_PTS_UPDATED: 'avplayerLevelPtsUpdated',
  // fired to notify that audio track lists has been updated data: { audioTracks : audioTracks}
  AUDIO_TRACKS_UPDATED: 'avplayerAudioTracksUpdated',
  // fired when an audio track switch occurs - data: {  id : audio track id} // deprecated in favor AUDIO_TRACK_SWITCHING
  AUDIO_TRACK_SWITCH: 'avplayerAudioTrackSwitch',
  // fired when an audio track switching is requested - data: {  id : audio track id}
  AUDIO_TRACK_SWITCHING: 'avplayerAudioTrackSwitching',
  // fired when an audio track switch actually occurs - data: {  id : audio track id}
  AUDIO_TRACK_SWITCHED: 'avplayerAudioTrackSwitched',
  // fired when an audio track loading starts - data: { url : audio track URL  id : audio track id}
  AUDIO_TRACK_LOADING: 'avplayerAudioTrackLoading',
  // fired when an audio track loading  finishes - data: { details : levelDetails object, id : audio track id, stats : { trequest, tfirst, tload, mtime} }
  AUDIO_TRACK_LOADED: 'avplayerAudioTrackLoaded',
  // fired to notify that subtitle track lists has been updated data: { subtitleTracks : subtitleTracks}
  SUBTITLE_TRACKS_UPDATED: 'avplayerSubtitleTracksUpdated',
  // fired when an subtitle track switch occurs - data: {  id : subtitle track id}
  SUBTITLE_TRACK_SWITCH: 'avplayerSubtitleTrackSwitch',
  // fired when an subtitle track loading starts - data: { url : subtitle track URL  id : subtitle track id}
  SUBTITLE_TRACK_LOADING: 'avplayerSubtitleTrackLoading',
  // fired when an subtitle track loading  finishes - data: { details : levelDetails object, id : subtitle track id, stats : { trequest, tfirst, tload, mtime} }
  SUBTITLE_TRACK_LOADED: 'avplayerSubtitleTrackLoaded',
  // fired when a subtitle fragment has been processed - data: { success : boolean, frag : the processed frag}
  SUBTITLE_FRAG_PROCESSED: 'avplayerSubtitleFragProcessed',
  // fired when the first timestamp is found. - data: { id : demuxer id, initPTS: initPTS , frag : fragment object}
  INIT_PTS_FOUND: 'avplayerInitPtsFound',
  // fired when a fragment loading starts - data: { frag : fragment object}
  FRAG_LOADING: 'avplayerFragLoading',
  // fired when a fragment loading is progressing - data: { frag : fragment object, { trequest, tfirst, loaded}}
  FRAG_LOAD_PROGRESS: 'avplayerFragLoadProgress',
  // Identifier for fragment load aborting for emergency switch down - data: {frag : fragment object}
  FRAG_LOAD_EMERGENCY_ABORTED: 'avplayerFragLoadEmergencyAborted',
  // fired when a fragment loading is completed - data: { frag : fragment object, payload : fragment payload, stats : { trequest, tfirst, tload, length}}
  FRAG_LOADED: 'avplayerFragLoaded',
  // fired when a fragment has finished decrypting - data: { id : demuxer id, frag: fragment object, stats : {tstart,tdecrypt} }
  FRAG_DECRYPTED: 'avplayerFragDecrypted',
  // fired when Init Segment has been extracted from fragment - data: { id : demuxer id, frag: fragment object, moov : moov MP4 box, codecs : codecs found while parsing fragment}
  FRAG_PARSING_INIT_SEGMENT: 'avplayerFragParsingInitSegment',
  // fired when parsing sei text is completed - data: { id : demuxer id, , frag: fragment object, samples : [ sei samples pes ] }
  FRAG_PARSING_USERDATA: 'avplayerFragParsingUserdata',
  // fired when parsing id3 is completed - data: { id : demuxer id, frag: fragment object, samples : [ id3 samples pes ] }
  FRAG_PARSING_METADATA: 'avplayerFragParsingMetadata',
  // fired when data have been extracted from fragment - data: { id : demuxer id, level : levelId, sn : sequence number, data1 : moof MP4 box or TS fragments, data2 : mdat MP4 box or null}
  FRAG_PARSING_DATA: 'avplayerFragParsingData',
  // fired when fragment parsing is completed - data: { id : demuxer id,frag: fragment object }
  FRAG_PARSED: 'avplayerFragParsed',
  // fired when fragment remuxed MP4 boxes have all been appended into SourceBuffer - data: { id : demuxer id,frag : fragment object, stats : { trequest, tfirst, tload, tparsed, tbuffered, length} }
  FRAG_BUFFERED: 'avplayerFragBuffered',
  // fired when fragment matching with current media position is changing - data : { id : demuxer id, frag : fragment object }
  FRAG_CHANGED: 'avplayerFragChanged',
  // Identifier for a FPS drop event - data: {curentDropped, currentDecoded, totalDroppedFrames}
  FPS_DROP: 'avplayerFpsDrop',
  //triggered when FPS drop triggers auto level capping - data: {level, droppedlevel}
  FPS_DROP_LEVEL_CAPPING: 'avplayerFpsDropLevelCapping',
  // Identifier for an error event - data: { type : error type, details : error details, fatal : if true, avplayer.js cannot/will not try to recover, if false, avplayer.js will try to recover,other error specific data}
  ERROR: 'avplayerError',
  // fired when avplayer.js instance starts destroying. Different from MEDIA_DETACHED as one could want to detach and reattach a media to the instance of avplayer.js to handle mid-rolls for example
  DESTROYING: 'avplayerDestroying',
  // fired when a decrypt key loading starts - data: { frag : fragment object}
  KEY_LOADING: 'avplayerKeyLoading',
  // fired when a decrypt key loading is completed - data: { frag : fragment object, payload : key payload, stats : { trequest, tfirst, tload, length}}
  KEY_LOADED: 'avplayerKeyLoaded',
  // fired upon stream controller state transitions - data: {previousState, nextState}
  STREAM_STATE_TRANSITION: 'avplayerStreamStateTransition',
  //setup flashplayer
  SETUP_FLASH: 'avplayerSetupFlash',
  //setup mobilehtml5 player
  SETUP_MOBILEH5: 'avplayerSetupMobileH5',
  //setup pchtml5 player mse
  SETUP_PCH5_HLS: 'avplayerSetupPCH5Hls',
  //setup pchtml5 player mp4
  SETUP_PCH5_DEFAULT: 'avplayerSetupPCH5Default',
  //pause
  PAUSE: 'avplayerPause',
  //play
  PLAY: 'avplayerPlay',
  //rewind
  REWIND: 'avplayerRewind',
  //mute
  MUTE: 'avplayerMute',
  //unmute
  UNMUTE: 'avplayerUnmute',
  //seek
  SEEK: 'avplayerSeek',
  //remove
  REMOVE: 'avplayerRemove',
  //resume
  RESUME: 'avplayerResume',
  //player state
  PLAYER_STATE_CHANGE: 'avplayerPlayerStateChange',
  //timeupdate
  TIME_UPDATE: 'avplayerTimeupdate',
  //set volume
  SET_VOLUME: 'avplayerSetVolume',
  //buffered update
  BUFFERED_UPDATE: 'avplayerBufferedUpdated',
  //build custom ui
  BUILD_CUSTOM_UI: 'avplayerBuildCustomUI'
};
