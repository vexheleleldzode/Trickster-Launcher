#ifndef OPENSSL_OPENSSLV_H
# define OPENSSL_OPENSSLV_H
# pragma once

# ifdef  __cplusplus
extern "C" {
# endif

# define OPENSSL_VERSION_MAJOR  3
# define OPENSSL_VERSION_MINOR  0
# define OPENSSL_VERSION_PATCH  8
# define OPENSSL_VERSION_PRE_RELEASE ""
# define OPENSSL_VERSION_BUILD_METADATA ""

# define OPENSSL_VERSION_TEXT   "OpenSSL 3.0.8 7 Feb 2023"

# define OPENSSL_VERSION_PREREQ(maj, min) \
        ((OPENSSL_VERSION_MAJOR == (maj) && OPENSSL_VERSION_MINOR >= (min)) || \
         (OPENSSL_VERSION_MAJOR > (maj)))

# define OPENSSL_FULL_VERSION_STR "3.0.8"

# define OPENSSL_VERSION_NUMBER  0x30000080L

# ifdef  __cplusplus
}
# endif
#endif
