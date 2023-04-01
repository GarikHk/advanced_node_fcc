$(document).ready(function () {
  //global io
  let socket = io();

  socket.on('user', data => {
    $('#num-users').text(data.currentUsers + ' users online');

    let message =
      data.username +
      (data.connected ? ' has joined the chat.' : ' has left the chat.');
    $('#messages').append($('<li>').html('<b>' + message + '</b>'));
  });

  // Form submittion with new message in field with id 'm'
  $('form').submit(function () {
    var messageToSend = $('#m').val();
    
    console.log(messageToSend);
    socket.emit('chat message', messageToSend);

    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });

  //Display messages
  socket.on('chat message', data => {
    let user = data.username;
    let message = data.message;
    $('#messages').append($('<li>').html(`<b>${user}:${message}</b>`));
  });
});
