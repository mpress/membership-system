{% extends '../../../src/views/base.swig' %}

{% set title = 'Discourse' %}
{% set heading = 'Discourse' %}

{% block content %}
	<p><img src="{{ discourse_user.avatar }}" /></p>

	<p>Hello there <strong>{{ discourse_user.username }}</strong>!</p>

	<p>Your account is linked with Discourse.</p>	
	
	<hr />

	<p>If this is not you please email the trustees for help.</p>
{% endblock %}