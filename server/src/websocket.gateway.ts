import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/chat', // 命名空间（可选）
  cors: { origin: '*' }, // 跨域配置
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server; // 注入 Socket.IO 服务器实例

  // 处理新连接
  handleConnection(client: Socket) {
    console.log(`客户端连接: ${client.id}`);
    // 向连接的客户端发送欢迎消息
    client.emit('welcome', '欢迎进入聊天室');
    // 向所有其他客户端广播新用户加入的消息
    client.broadcast.emit('message', { sender: 'system', content: `${client.id} 加入了聊天室` });
  }

  // 处理断开连接
  handleDisconnect(client: Socket) {
    console.log(`客户端断开: ${client.id}`);
    // 向所有其他客户端广播用户离开的消息
    client.broadcast.emit('message', { sender: 'system', content: `${client.id} 离开了聊天室` });
  }

  // 订阅消息并广播
  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: string) {
    console.log(`收到消息: ${payload} 来自客户端: ${client.id}`);
    this.server.emit('message', { sender: client.id, content: payload }); // 广播给所有客户端
  }

  // 加入房间（分组通信）
  @SubscribeMessage('joinRoom')
  joinRoom(client: Socket, room: string) {
    client.join(room);
    client.to(room).emit('notification', `${client.id} 加入了房间`);
  }
}
