// 封装弹窗layer组件等
var common_ops = {
  alert:function( msg ,cb ){
      layer.alert( msg,{
          yes:function( index ){
              if( typeof cb == "function" ){
                  cb();
              }
              layer.close( index );
          }
      });
  },
  confirm:function( msg,callback ){
      callback = ( callback != undefined )?callback: { 'ok':null, 'cancel':null };
      layer.confirm( msg , {
          btn: ['确定','取消'] //按钮
      }, function( index ){
          //确定事件
          if( typeof callback.ok == "function" ){
              callback.ok();
          }
          layer.close( index );
      }, function( index ){
          //取消事件
          if( typeof callback.cancel == "function" ){
              callback.cancel();
          }
          layer.close( index );
      });
  },
  tip:function( msg,target ){
      layer.tips( msg, target, {
          tips: [ 3, '#e5004f']
      });
      $('html, body').animate({
          scrollTop: target.offset().top - 10
      }, 100);
  },
  copy:function(elemSelect){
	  // 当#myElement被双击时，复制元素文本
	  $(elemSelect).dblclick(function() {
      ClipboardJS.copy(this);
      //common_ops.alert('已复制');
	layer.msg("已复制");
	  });
  },
};


// 功能
$(document).ready(function() {
  var chatBtn = $('#chatBtn');
  var chatInput = $('#chatInput');
  var chatWindow = $('#chatWindow');
var dataKey = getCookie("apikey")
 $(".key").hide();
  // 存储对话信息,实现连续对话
  var messages = []

  // 转义html代码，防止在浏览器渲染
  function escapeHtml(html) {
    var text = document.createTextNode(html);
    var div = document.createElement('div');
    div.appendChild(text);
    return div.innerHTML;
  }
//获取cookie：
function getCookie(name) {
  const cookieStr = document.cookie;
  const cookies = cookieStr.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length + 1, cookie.length);
    }
  }
  return null;
}


//设置cookie：
function setCookie(name, value, expires, path, domain, secure) {
  let cookieStr = name + '=' + value;
  if (expires) {
    const date = new Date();
    date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
    cookieStr += '; expires=' + date.toGMTString();
  }
  if (path) {
    cookieStr += '; path=' + path;
  }
  if (domain) {
    cookieStr += '; domain=' + domain;
  }
  if (secure) {
    cookieStr += '; secure';
  }
  document.cookie = cookieStr;

}

  // 添加消息到窗口,对message进行转义，防止html被浏览器渲染
  function addMessage(message,imgName) {
    $(".answer .tips").css({"display":"none"});    // 打赏卡隐藏
    chatInput.val('');
    var escapedMessage = message; //escapeHtml(message);
    var messageElement = $('<div class="row message-bubble"><img class="chat-icon" src="./static/images/' + imgName + '"><p class="message-text"> </p></div>');
    chatWindow.append(messageElement);
    printChar(messageElement.children()[1],escapedMessage);
  }

//隔0.1秒输出字符串
function printChar(targetElement,message){
let index = 0;
const timer = setInterval(() => {
  targetElement.textContent += message[index];
  index++;
  if (index === message.length) {
    clearInterval(timer);
  }
  chatWindow.animate({ scrollTop: chatWindow.prop('scrollHeight') }, 50);
}, 50); // 0.1秒为100毫秒

}

  // 请求失败不用转义html
  function addFailMessage(message) {
    $(".answer .tips").css({"display":"none"});      // 打赏卡隐藏
    chatInput.val('');
    var messageElement = $('<div class="row message-bubble"><img class="chat-icon" src="./static/images/chatgpt.png"><p class="message-text">' +  message + '</p></div>');
    chatWindow.append(messageElement);
    chatWindow.animate({ scrollTop: chatWindow.prop('scrollHeight') }, 500);
  }
  
  // 处理用户输入
  chatBtn.click(function() {
    // 解绑键盘事件
    chatInput.off("keydown",handleEnter);
    
    // 保存api key与对话数据
    var data = {
      "apiKey" : "", // 这里填写固定 apiKey
    }
   //判断是否有cookie

    // 判断是否使用自己的api key
    if ($(".key .ipt-1").prop("checked")){
      var apiKey = $(".key .ipt-2").val();
      if (apiKey.length < 20 ){
          common_ops.alert("请输入正确的 api key ！",function(){
            chatInput.val('');
            // 重新绑定键盘事件
            chatInput.on("keydown",handleEnter);
          })
          return
      }
	  else
	  {
        data.apiKey = apiKey;
		setCookie("apikey",apiKey);
      }
    }
	else{
      data.apiKey = dataKey;
	}

    var message = chatInput.val();
    if (message.length == 0){
      common_ops.alert("请输入内容！",function(){
        chatInput.val('');
        // 重新绑定键盘事件
        chatInput.on("keydown",handleEnter);
      })
      return
    }


    addMessage(message,"avatar.png");

    // 将用户消息保存到数组
    messages.push({"role": "user", "content": message})

    // 收到回复前让按钮不可点击
    chatBtn.attr('disabled',true)

    data.prompt = messages

    console.log(data);

    // 发送信息到后台
    $.ajax({
      url: 'https://iqa3.raydose.com',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + data.apiKey
      },
      data: JSON.stringify({
        "messages": data.prompt,
        "model": "gpt-3.5-turbo",
        "max_tokens": 2048,
        "temperature": 0.5,
        "top_p": 1,
        "n": 1
      }),
      success: function(res) {
        const resp = res["choices"][0]["message"];
       
        addMessage(resp.content,"chatgpt.png");
        // 收到回复，让按钮可点击
        chatBtn.attr('disabled',false)
        // 重新绑定键盘事件
        chatInput.on("keydown",handleEnter);
        // 将回复添加到数组
        messages.push(resp)
		//".message-text"双击可复制
		common_ops.copy(".message-text");
      },
      error: function(jqXHR, textStatus, errorThrown) {
        addFailMessage('<span style="color:red;">' + '服务器很忙啦~请您稍后再试!'+'</span>');
        chatBtn.attr('disabled',false);
        chatInput.on("keydown",handleEnter);
        messages.pop() // 失败就让用户输入信息从数组删除
        //".message-text"双击可复制
		common_ops.copy(".message-text");
      }
    });
  });

  // Enter键盘事件
  function handleEnter(e){
    if (e.keyCode==13){
      chatBtn.click();
    }
  }

  // 绑定Enter键盘事件
  chatInput.on("keydown",handleEnter);
  
  // 禁用右键菜单
  document.addEventListener('contextmenu',function(e){
    e.preventDefault();  // 阻止默认事件
  });

  // 禁止键盘F12键
  document.addEventListener('keydown',function(e){
    if(e.key == 'F12'){
        e.preventDefault(); // 如果按下键F12,阻止事件
    }
  });
});
