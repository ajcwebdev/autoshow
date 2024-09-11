# whisper.cpp/Dockerfile

FROM --platform=linux/arm64 ubuntu:22.04 AS build

WORKDIR /app

RUN apt-get update && \
    apt-get install -y build-essential libopenblas-dev pkg-config \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

COPY .. .

ENV CFLAGS="-march=armv8-a"
ENV CXXFLAGS="-march=armv8-a"

RUN make clean

RUN make GGML_OPENBLAS=1

FROM --platform=linux/arm64 ubuntu:22.04 AS runtime

WORKDIR /app

RUN apt-get update && \
    apt-get install -y curl ffmpeg libopenblas-dev \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

COPY --from=build /app /app

ENTRYPOINT [ "bash", "-c" ]