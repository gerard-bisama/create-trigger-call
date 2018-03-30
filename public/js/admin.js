$.ajaxSetup({
	xhrFields: {withCredentials: true},
	error: function(xhr, status, error) {
	$('.alert').removeClass('hidden');
	$('.alert').html('Status: ' + status + ', error: ' + error);
	}
});

var findTr = function(event) {
var target = event.srcElement || event.target;
var $target = $(target);
var $tr = $target.parents('tr');
return $tr;
};

var remove = function(event) {
	var $tr = findTr(event);
	var id = $tr.attr('data-id');
	$.ajax({
		url: '/api/users/' + id,
		type: 'DELETE',
		success: function(data, status, xhr) {
		$('.alert').addClass('hidden');
		$tr.remove();
		}
	})
};

$(document).ready(function(){
	var $element = $('table.table.table-striped tbody');
	$element.on('click', 'button.remove', remove);
}) 
