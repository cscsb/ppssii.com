<?php
/*
 *	[jnpar] (C)2018-2023 jnpar����ſ��ҫ��Ʒ.
 *	�ⲻ��һ����ѵĳ�����QQ��94526868�ṩ����֧�֣����趨�ƻ��߸��Ի��޸Ĳ������ӭ��������ϵ��
 *  ��������վwww.jnpar.com �����ƹ㣬������ʻ��١�
 *	$_G['basescript'] = ģ������
 *	CURMODULE = Ϊģ���Զ��峣��
 */
 
if(!defined('IN_DISCUZ')) {
	exit('Access Denied');
}

class table_jnpar_add extends discuz_table
{
	public function __construct() {
		$this->_table = 'jnpar_add';
		$this->_pk    = '';
		parent::__construct();
	} 
	
	public function getuid(){
		global $_G;
		//dsetcookie('outloginuid', $uid, 3600*24*30);
		//$_GET['uid']=intval($_GET['uid']);
		//$uid = $_GET['uid']?$_GET['uid']:$_G['uid'];
		$uid = $_G['uid'];
		if (!$uid) {
			if (getcookie('outloginuid')) {
				$uid = getcookie('outloginuid');
			}else{
				//$uid = 9999999+rand(100000,9999999);
				$uid = 8378600+rand(1000,9999);
				dsetcookie('outloginuid', $uid, 3600*24*30);
			}
		}
		$_GET['uid']=$uid;
		//debug($uid);
		return $uid;
	}
	
}