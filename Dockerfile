FROM node:12


RUN apt-get update &&\
    apt-get install -y \
    python-dev \
    python-pip \
    automake wget sox unzip swig build-essential libtool zlib1g-dev locales libatlas-base-dev &&\
    apt-get clean


# Build kaldi
## Download kaldi toolkit
RUN cd /opt && git clone https://github.com/kaldi-asr/kaldi.git

## Install main libraries
RUN cd /opt/kaldi/tools && \
    extras/install_mkl.sh && \
    make -j$(nproc)


#Install NLP packages
RUN cd /opt/kaldi/tools && \
    extras/install_phonetisaurus.sh && \
    extras/install_irstlm.sh

#Install auxiliary packages
RUN pip install numpy
RUN cd /opt/kaldi/tools && \
    pip install git+https://github.com/sequitur-g2p/sequitur-g2p && git clone https://github.com/sequitur-g2p/sequitur-g2p

## Install main Kaldi functions
RUN cd /opt/kaldi/src && \
    sed -i -e ':a;N;$!ba;s:\\\n::g' Makefile && \
    sed -i -e 's:^SUBDIRS = .*$:SUBDIRS = base matrix util tree gmm transform fstext hmm lm decoder lat cudamatrix bin lmbin fstbin:g' -e 's:^MEMTESTDIRS = .*$:MEMTESTDIRS = :g' Makefile && \
    ./configure --shared && make depend -j2 && make -j2

RUN /bin/bash -c "cd /opt/kaldi/src && /bin/rm */*{.a,.o}"



## Install main npm modules
WORKDIR /usr/src/app
COPY ./package.json ./
RUN npm install


## Prepare work directories
COPY ./components ./components
COPY ./lib ./lib
COPY ./models /usr/src/app/models
COPY ./app.js ./config.js ./.defaultparam ./docker-healthcheck.js ./docker-entrypoint.sh ./wait-for-it.sh ./
RUN mkdir /opt/model /opt/nginx && cp -r /opt/kaldi/egs/wsj/s5/utils ./components/LinSTT/Kaldi/scripts/




ENV PATH /opt/kaldi/egs/wsj/s5/utils:/opt/kaldi/tools/openfst/bin:/opt/kaldi/src/fstbin:/opt/kaldi/src/lmbin:/opt/kaldi/src/bin:/opt/kaldi/tools/phonetisaurus-g2p/src/scripts:/opt/kaldi/tools/phonetisaurus-g2p:/opt/kaldi/tools/sequitur-g2p/g2p.py:/opt/kaldi/tools/irstlm/bin:$PATH

EXPOSE 80

HEALTHCHECK CMD node docker-healthcheck.js || exit 1

# Entrypoint handles the passed arguments
ENTRYPOINT ["./docker-entrypoint.sh"]

#CMD [ "npm", "start" ]
