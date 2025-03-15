#!/bin/bash

# This is a wrapper for git commands involving GitHub
# do not forget to make this file executable when using for the first time: chmod +x ~/s.sh

# also, when using for the first time, make sure that content of .env
# is loaded as environment variables using the command lines below:

#set -a  # Automatic export on
#source .env
#set +a  # Disable automatic export

# SSH setup section
mkdir -p ~/.ssh

cat <<EOF > ~/.ssh/glitch-key
${GITHUB_SSH_KEY1}
${GITHUB_SSH_KEY2}
${GITHUB_SSH_KEY3}
${GITHUB_SSH_KEY4}
${GITHUB_SSH_KEY5}
${GITHUB_SSH_KEY6}
${GITHUB_SSH_KEY7}
${GITHUB_SSH_KEY8}
EOF

echo "${GITHUB_SSH_KEY10}" > ~/.ssh/glitch-key.pub

chmod 600 ~/.ssh/glitch-key
chmod 644 ~/.ssh/glitch-key.pub

eval $(ssh-agent -s)
ssh-add ~/.ssh/glitch-key

echo "SSH key added and agent configured."

# Execute the provided Git command
"$@"

# SSH cleanup section
if [ -n "$SSH_AGENT_PID" ]; then
    eval $(ssh-agent -k)
fi

rm -f ~/.ssh/glitch-key
rm -f ~/.ssh/glitch-key.pub

echo "SSH keys and agent cleaned up."
