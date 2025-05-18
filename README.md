# Weibo Saver JS

A Node.js application that automatically saves Weibo posts shared via email. The application monitors an email inbox for Weibo share links, processes them, and saves the content as Markdown files with downloaded media.

## Features

- Monitors an email inbox for Weibo share links
- Extracts Weibo content, including text, images, and videos
- Saves content as Markdown files with a clean template
- Downloads and saves images and videos locally
- Organizes saved content by date (YYYY/MM/DD folder structure)
- Runs as a Docker container for easy deployment

## Prerequisites

- Node.js (current version)
- Email account with IMAP access
- Docker (for containerized deployment)

## Installation

### Local Development

1. Clone the repository

```bash
git clone <repository-url>
cd weibo-saver-js
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the project root with the following variables:

```
IMAP_USER=your-email@example.com
IMAP_PASSWORD=your-email-password
IMAP_HOST=imap.example.com
MAIL_ALLOWED_FROM=sender1@example.com,sender2@example.com
```

## Configuration

### Environment Variables

- `IMAP_USER`: Your email username/address
- `IMAP_PASSWORD`: Your email password
- `IMAP_HOST`: IMAP server hostname
- `MAIL_ALLOWED_FROM`: Comma-separated list of email addresses that are allowed to send Weibo shares

## Usage

### Running Locally

Start the application:

```bash
node main.js
```

### How It Works

1. The application connects to the specified email account via IMAP
2. It monitors the inbox for new emails with "微博分享" (Weibo share) in the subject line
3. When a matching email is received, it extracts the Weibo URL
4. The application fetches the Weibo post content, including text, images, and videos
5. Content is saved as a Markdown file in the `saved_data/YYYY/MM/DD/` directory
6. Images and videos are downloaded to the `images` and `videos` subdirectories

## Docker Deployment

### Building the Docker Image

```bash
docker build -t weibo-saver-js .
```

### Running with Docker Compose

1. Modify the `docker-compose.yaml` file to set your volume mount path
2. Run the container:

```bash
docker-compose up -d
```

The default configuration mounts the `/mnt/data_sda1/syncthing/obsidianvault/weibo-clipper` directory to `/opt/app/saved_data` in the container. Adjust this path according to your needs.

## Output Format

The saved Markdown files follow this template:

```markdown
---
title: [Post Title]
site: weibo.com
date saved: [Date]
user: [Username]
created at: [Creation Time]
url: [Weibo URL]
---

# [Post Title]
#weibo

---
### [Username]
[Post Content]

---
### [Original Username (if reposted)]
[Original Post Content]

---
[Images]

---
[Videos]
```

## License

ISC

## Author

[Your Name]