# avplayer.js
一个根据浏览器环境决定生成html5或flash播放器的js sdk，支持播放hls mp4。

在支持MediaSourceExtensions的浏览器上，sdk会优先生成html5播放器；
在IE6～IE11等浏览器上，sdk会优先生成flash播放器;同时sdk提供一个参数preferFlash，此参数设为1的时候，sdk会无视浏览器环境生成flash播放器。

此项目代码主要参考(copy)了hls.js https://github.com/video-dev/hls.js/tree/master<br/>
做了以下微小的工作：<br/>
　　1）优化音视频处理(demux-remux)逻辑，兼容更多异常视频<br/>
　　2）接入flash(https://github.com/yangq1990/avplayer-flash/tree/master) 作为fallback，提供一个pc浏览器、移动端浏览器等web端的播放器解决方案<br/>
　　3）优化代码结构，方便协同开发<br/>

<b>How to use:</b><br/>
　　```git clone https://github.com/yangq1990/avplayer.js.git```<br/>
　　```cd avplayer.js```<br/>
　　```npm install```　　　　#安装项目依赖<br/>
　　```npm run build```　　　#生成avplayer.js<br/>
　　```npm run release```　　#生成压缩版 avplayer.min.js<br/>
　　```npm run serve```　　　#运行server<br/>
　　```npm run open```　　　&ensp;#打开demo目录的index.html<br/>

感兴趣的朋友可以加微信:yangqiao2010212，方便交流