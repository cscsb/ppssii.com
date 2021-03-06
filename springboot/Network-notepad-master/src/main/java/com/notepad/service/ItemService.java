package com.notepad.service;

import java.security.Principal;
import java.util.List;

import com.notepad.dto.ItemDTO;

public interface ItemService {

	ItemDTO save(ItemDTO itemDTO, Principal principal);

	void delete(Long itemId);

	List<ItemDTO> findAllByMenu(Long menuId);

}
