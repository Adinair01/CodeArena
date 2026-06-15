# Sandbox image with the compilers/interpreters needed for grading.
# Build:  docker build -t online-judge-executor backend/docker
#
# The current codeExecutor runs locally by default. To run submissions inside
# this image instead, mount the temp source dir and exec the compiler/runtime,
# e.g.:  docker run --rm --network=none --memory=256m --cpus=1 \
#           -v /path/to/src:/sandbox online-judge-executor <command>
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    python3 \
    openjdk-17-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

# Unprivileged user to run untrusted code.
RUN useradd -m -u 1001 runner
USER runner
WORKDIR /sandbox

CMD ["/bin/bash"]
