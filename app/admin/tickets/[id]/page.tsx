'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout, Button, Input, List, Avatar, Card, Spin, Tag, Space, Image, Upload, message, Select } from 'antd';
import { ArrowLeftOutlined, SendOutlined, UserOutlined, CustomerServiceOutlined, PaperClipOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { TextArea } = Input;
const { Option } = Select;

interface TicketMessage {
    id: string;
    senderId: string;
    senderRole: 'USER' | 'ADMIN';
    message: string;
    imageUrl?: string;
    attachments?: { id: string, url: string, type: string }[];
    createdAt: string;
}

// ... inside component

const [attachments, setAttachments] = useState<string[]>([]);
// ...

const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    setSending(true);
    try {
        const res = await fetch(`/api/tickets/${ticketId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: newMessage,
                senderRole: 'ADMIN',
                attachments: attachments // Send as array
            })
        });

        if (res.ok) {
            setNewMessage('');
            setAttachments([]);
            fetchData();
        } else {
            message.error('Failed to send message');
        }
    } catch (error) {
        message.error('Error sending message');
    } finally {
        setSending(false);
    }
};

const handleImageUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (res.ok) {
            const data = await res.json();
            setAttachments(prev => [...prev, data.url]);
            onSuccess("Ok");
        } else {
            onError("Upload failed");
        }
    } catch (err) {
        onError("Upload error");
    } finally {
        setUploading(false);
    }
};

// ... render loop
<div className="whitespace-pre-wrap">{msg.message}</div>
{/* Legacy single image */ }
{
    msg.imageUrl && (
        <Image
            src={msg.imageUrl}
            alt="attachment"
            className="mt-2 rounded-lg max-h-48 object-cover"
            width={200}
        />
    )
}
{/* New multiple attachments */ }
{
    msg.attachments && msg.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
            {msg.attachments.map(att => (
                <Image
                    key={att.id}
                    src={att.url}
                    alt="attachment"
                    className="rounded-lg object-cover"
                    width={150}
                    height={100}
                />
            ))}
        </div>
    )
}
<div className={`text-xs mt-1 ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
    {new Date(msg.createdAt).toLocaleString()}
</div>

// ... render input area
{/* Input Area */ }
<div className="glass-panel rounded-2xl p-4 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
    {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((url, idx) => (
                <div key={idx} className="relative inline-block">
                    <Image src={url} height={60} width={60} className="rounded object-cover" />
                    <Button
                        className="absolute -top-2 -right-2"
                        size="small"
                        shape="circle"
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    />
                </div>
            ))}
        </div>
    )}
    <div className="flex gap-2">
        <Upload
            customRequest={handleImageUpload}
            showUploadList={false}
            accept="image/*"
            multiple
        >
            <Button icon={uploading ? <LoadingOutlined /> : <PaperClipOutlined />} />
        </Upload>
        <TextArea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a reply..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            onPressEnter={(e) => {
                if (!e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                }
            }}
        />
        <Button
            type="primary"
            icon={<SendOutlined />}
            loading={sending}
            onClick={handleSendMessage}
            className="bg-purple-600 hover:bg-purple-500"
        >
            Send
        </Button>
    </div>
</div>
        </Content >
    );
}
