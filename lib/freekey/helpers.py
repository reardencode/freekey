import urlparse

def simplify(url):
    '''Take a URL and simplify it to a domain w/o www.

    >>> simplify('https://online.citibank.com/US/JPS/portal/Index.do')
    'online.citibank.com'
    >>> simplify('https://www.wellsfargo.com/')
    'wellsfargo.com'
    >>> simplify('www.wellsfargo.com/somesite')
    'wellsfargo.com'
    '''
    if not url.find('://') >= 0:
        url = 'http://' + url
    domain = urlparse.urlparse(url)[1]
    if domain.startswith('www.'):
        return domain[4:]
    return domain

