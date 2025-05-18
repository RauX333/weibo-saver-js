/**
 * Email monitoring service for the Weibo Saver application
 * Listens for incoming emails and emits events when new emails are received
 */
import Imap from 'node-imap';
import { EventEmitter } from 'events';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import async from 'async';
import { config } from '../../config/config.js';
import { logger } from '../../utils/logger.js';

export class MailListener extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this.markSeen = !!options.markSeen;
    this.mailbox = options.mailbox || 'INBOX';
    if ('string' === typeof options.searchFilter) {
      this.searchFilter = [options.searchFilter];
    } else {
      this.searchFilter = options.searchFilter || ['UNSEEN'];
    }
    this.fetchUnreadOnStart = !!options.fetchUnreadOnStart;
    this.mailParserOptions = options.mailParserOptions || {};
    if (options.attachments && options.attachmentOptions && options.attachmentOptions.stream) {
      this.mailParserOptions.streamAttachments = true;
    }
    this.attachmentOptions = options.attachmentOptions || {};
    this.attachments = options.attachments || false;
    this.attachmentOptions.directory = (this.attachmentOptions.directory ? this.attachmentOptions.directory : '');
    this.imap = new Imap({
      xoauth2: options.xoauth2,
      user: options.username,
      password: options.password,
      host: options.host,
      port: options.port,
      tls: options.tls,
      autotls: options.autotls || true,
      tlsOptions: options.tlsOptions || { rejectUnauthorized: false },
      connTimeout: options.connTimeout || null,
      authTimeout: options.authTimeout || null,
      debug: options.debug || null,
      keepalive: options.keepalive || null,
    });
    this.imap.once('ready', this.imapReady.bind(this));
    this.imap.once('close', this.imapClose.bind(this));
    this.imap.on('error', this.imapError.bind(this));
  }

  start() {
    logger.info('Starting mail listener');
    this.imap.connect();
  }

  stop() {
    logger.info('Stopping mail listener');
    this.imap.end();
  }

  imapReady() {
    if (this.options.host.includes('163.com')) {
      this.imap.id({ name: 'test' }, () => { });
    }
    this.imap.openBox(this.mailbox, false, (error, mailbox) => {
      if (error) {
        this.emit('error', error);
        logger.error('Error opening mailbox', error);
      } else {
        logger.info('Connected to mail server');
        this.emit('server:connected');
        this.emit('mailbox', mailbox);
        if (this.fetchUnreadOnStart) {
          this.parseUnread.call(this);
        }
        let listener = this.imapMail.bind(this);
        this.imap.on('mail', listener);
        this.imap.on('update', listener);
      }
    });
  }

  imapClose() {
    logger.info('Disconnected from mail server');
    this.emit('server:disconnected');
  }

  imapError(error) {
    if (error) {
      logger.error('IMAP error', error);
      this.emit('error', error);
    }
  }

  imapMail() {
    this.parseUnread.call(this);
  }

  parseUnread() {
    this.imap.search(this.searchFilter, (error, results) => {
      if (error) {
        this.emit('error', error);
        logger.error('Error searching for unread emails', error);
      } else if (results.length > 0) {
        this.fetch(results);
      }
    });
  }

  fetch(results) {
    try {
      const f = this.imap.fetch(results, {
        bodies: '',
        markSeen: this.markSeen
      });

      f.on('message', (msg, seqno) => {
        const parser = async () => {
          const stream = await this.findAttachmentParts(msg, seqno);
          const mail = await simpleParser(stream, this.mailParserOptions);
          this.emit('mail', mail, seqno);
          logger.info('Received new email', { subject: mail.subject });
        };
        parser();
      });

      f.once('error', (error) => {
        this.emit('error', error);
        logger.error('Error fetching email', error);
      });
    } catch (error) {
      this.emit('error', error);
      logger.error('Error in fetch process', error);
    }
  }

  findAttachmentParts(msg, seqno) {
    return new Promise((resolve) => {
      let bodyData = '';
      msg.on('body', (stream) => {
        stream.on('data', (chunk) => {
          bodyData += chunk.toString('utf8');
        });
        stream.once('end', () => {
          resolve(bodyData);
        });
      });
    });
  }
}

/**
 * Create a mail listener instance with the application configuration
 * @returns {MailListener} Configured mail listener instance
 */
export function createMailListener() {
  return new MailListener(config.imap);
}