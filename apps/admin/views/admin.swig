{% extends '../../../src/views/base.swig' %}

{% set title = 'Admin' %}
{% set heading = 'Admin' %}
{% set activeApp = 'admin' %}

{% block content %}
	<p>
		<a href="/admin/members" class="btn btn-default btn-lg"><span class="glyphicon glyphicon-user"></span> Members</a></li>
	</p>
	<p>
		<a href="/admin/permissions" class="btn btn-default btn-lg"><span class="glyphicon glyphicon-lock"></span> Permissions</a>
	</p>
{% endblock %}