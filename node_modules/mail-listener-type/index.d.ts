import { EventEmitter } from 'events';
import { ConnectionOptions } from 'tls';

export { _MailListener as MailListener };
declare const _MailListener: typeof MailListener;

declare class MailListener extends EventEmitter {
    constructor(options: IOptions);
    markSeen: boolean;
    mailbox: any;
    searchFilter: any;
    fetchUnreadOnStart: boolean;
    mailParserOptions: any;
    attachmentOptions: any;
    attachments: any;
    imap: any;
    start(): void;
    stop(): void;
    imapReady(): void;
    imapClose(): void;
    imapError(error: any): void;
    imapMail(): void;
    parseUnread(): void;
}

export interface IOptions {
    username: string;
    password: string;
    xoauth2?: string;
    host?: string;
    port?: number;
    tls?: boolean;
    autotls?: string;
    connTimeout?: number;
    authTimeout?: number;
    socketTimeout?: number;
    debug?: (info: string) => void;
    tlsOptions?: ConnectionOptions;
    mailbox?: string;
    searchFilter?: string[];
    markSeen?: boolean;
    fetchUnreadOnStart: boolean;
    mailParserOptions?: { streamAttachments: boolean };
    attachments: boolean;
    attachmentOptions?: {
      saveAttachments: boolean;
      directory: string;
      stream: boolean;
    };
    keepalive?: {
        interval: number,
        idleInterval: number,
        forceNoop: boolean,
    }
  }