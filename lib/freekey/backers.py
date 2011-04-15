
class DiskBacker:

    def __init__(self, path):
        import os
        self.pack_filename = os.path.join(path, 'pack')
        if not os.path.isdir(path):
            os.path.makedirs(path)

    def readpack(self):
        try:
            with open(self.pack_filename, 'rb') as f:
                return f.read()
        except IOError, e:
            if e.errno == 2:
                return ''
            raise


    def writepack(self, data):
        with open(self.pack_filename, 'wb') as f:
            f.write(data)

class S3Backer:

    def __init__(self, bucket, access, secret):
        from boto.exception import S3ResponseError
        from boto.s3.connection import S3Connection
        conn = S3Connection(access, secret)
        try:
            self.bucket = conn.get_bucket(bucket)
        except S3ResponseError, e:
            if e.status != 404:
                raise
            self.bucket = conn.create_bucket(bucket)
    
    def readpack(self):
        from boto.exception import S3ResponseError
        try:
            self.bucket.get_key('pack')
        except S3ResponseError, e:
            if e.status == 404:
                return ''
            raise

    def writepack(self, data):
        from boto.exception import S3ResponseError
        try:
            key = self.bucket.get_key('pack')
        except S3ResponseError, e:
            if e.status != 404:
                raise
        if not key:
            key = self.bucket.new_key('pack')
        key.set_contents_from_string(data)



