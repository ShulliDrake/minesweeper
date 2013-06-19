from django.conf import settings
from django.shortcuts import render_to_response
from django.template import RequestContext


def minesweeper(request):

    return render_to_response("sweeper.html",
                              {},
                              context_instance=RequestContext(request))

