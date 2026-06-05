// ignore_for_file: avoid_print
import 'dart:io';

void main() async {
  try {
    print('Connecting...');
    final socket = await WebSocket.connect('ws://127.0.0.1:8765');
    print('Connected!');
    socket.listen((msg) {
      print('Received: $msg');
    });
  } catch (e) {
    print('Error: $e');
  }
}
